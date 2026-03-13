import httpFunctions from "@/lib/http/functions/http-functions";
import { computeHttpAst, Expression, FormBodyNode, HttpNode, JsonBodyNode, TextBodyNode } from "@/lib/http/parser/http-ast"
import DefaultFileStorage from "../files/file-default";
import { computeHttpDiagnostics } from "@/lib/http/linter/http-linter";
import Task from "true-myth/task";


export type ResolveError = {
    message: string,
}

export default async function resolveHttpTemplate(template: string, context: ExecutionContext = { variables: new Map(), baseUrl: () => Task.reject({ message: 'base URL is required' }) }): Promise<HttpRequest | ResolveError> {

    const ast = computeHttpAst(template);

    const errors = computeHttpDiagnostics(template, Array.from(context.variables.entries()).map(([key, value]) => ({ key, value })));
    if (errors.length > 0) {
        return { message: 'request contains errors' }
    }

    const urlNode = ast.url[0]
    const url = await value(urlNode);
    const baseUrl = url.startsWith('/') ? await context.baseUrl() : null;

    if (url.startsWith('/') && baseUrl!.isErr) {
        return { message: baseUrl?.error.message! }
    }

    async function value(node: HttpNode | null): Promise<string> {
        if (!node) {
            return "";
        }

        const text = template.substring(node.from, node.to);

        if (node.type === 'variable') {
            const key = text.replace(/[<>]/g, "");
            const value = context.variables.get(key);
            if (value !== undefined) {
                return value;
            }
        }

        if (node.type === 'function') {
            const name = await value(node.name);
            const args = await Promise.all(node.args.map(value));
            return httpFunctions.get(name)!.execute(args)
        }

        if (node.type === 'json-value') {
            return `"${await value(node.value)}"`
        }

        return text
    }

    async function formExpressionValue(node: Expression): Promise<string | Blob> {
        if (node.type === 'function') {
            const name = await value(node.name);

            if (name === 'readFile') {
                const path = await value(node.args[0]);
                const fileStorage = DefaultFileStorage.getInstance();
                return fileStorage.readFile(path)
            }
        }

        return value(node)
    }

    async function bodyValue(node: FormBodyNode | JsonBodyNode | TextBodyNode | null): Promise<string | URLSearchParams | FormData> {
        if (!node) {
            return "";
        }

        if (node.type === 'urlencoded') {
            const params = new URLSearchParams();
            await Promise.all(node.entries.map(async entry => {
                const key = await value(entry.key);
                const val = await value(entry.value);
                params.append(key, val);
            }))
            return params;
        } else if (node.type === 'multipart') {
            const formData = new FormData();
            await Promise.all(node.entries.map(async entry => {
                const key = await value(entry.key);
                const val = await formExpressionValue(entry.value);
                formData.append(key, val);
            }))
            return formData;
        } else if (node.type === 'json') {
            return (await Promise.all(node.children.map(value))).join("")
        }

        return value(node)
    }

    async function resolveUrl(nodes: HttpNode[]): Promise<string> {
        return (await Promise.all(nodes.map(async (node, index) => {
            if (index === 0) {
                const resolved = await value(node);
                if (resolved.startsWith('/')) {
                    return baseUrl!.unwrapOr('') + url;
                }
                return resolved;
            } else {
                return value(node);
            }

        }))).join("");
    }


    return {
        method: await value(ast.method),
        url: await resolveUrl(ast.url),
        headers: await Promise.all(ast.headers.map(async h => [await value(h.key), await value(h.value)] as [string, string])),
        body: await bodyValue(ast.body)
    }

}

type ExecutionContext = {
    variables: Map<string, string>
    baseUrl: () => Task<string, ResolveError>
}



export type HttpRequest = {
    method: string,
    url: string,
    headers: [string, string][],
    body: string | URLSearchParams | FormData
}