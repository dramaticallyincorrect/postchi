import { computeHttpAst, FormBodyNode, HttpNode, JsonBodyNode, TextBodyNode } from "@/lib/http/parser/http-ast"

export type ResolveError = {
    message: string,
}

export default function resolveHttpTemplate(template: string, context: ExecutionContext = { variables: new Map() }): HttpRequest | ResolveError {

    const ast = computeHttpAst(template);

    if (ast.errors.length > 0) {
        return { message: 'request contains errors' }
    }

    function value(node: HttpNode | null) {
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
        return text
    }

    function bodyValue(node: FormBodyNode | JsonBodyNode | TextBodyNode | null): string | URLSearchParams | FormData {
        if (!node) {
            return "";
        }

        if (node.type === 'urlencoded') {
            const params = new URLSearchParams();
            node.entries.forEach(entry => {
                const key = value(entry.key);
                const val = value(entry.value);
                params.append(key, val);
            })
            return params;
        } else if (node.type === 'multipart') {
            const formData = new FormData();
            node.entries.forEach(entry => {
                const key = value(entry.key);
                const val = value(entry.value);
                formData.append(key, val);
            })
            return formData;
        }

        return template.substring(node.from, node.to);
    }


    return {
        method: value(ast.method),
        url: ast.url.map(value).join(""),
        headers: ast.headers.map(h => [value(h.key), value(h.value)] as [string, string]),
        body: bodyValue(ast.body)
    }

}

type ExecutionContext = {
    variables: Map<string, string>
}


export type HttpRequest = {
    method: string,
    url: string,
    headers: [string, string][],
    body: string | URLSearchParams | FormData
}