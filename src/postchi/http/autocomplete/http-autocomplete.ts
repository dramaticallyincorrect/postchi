import { Completion, CompletionContext, CompletionResult, snippetCompletion } from "@codemirror/autocomplete"
import { httpHeaders } from "./http-headers"
import DefaultFileStorage from "@/lib/storage/files/file-default"
import { asVariable } from "@/lib/utils/variable-name"
import { json } from '@codemirror/lang-json';
import { computeHttpAst, Expression, FormBodyNode, HeaderNode, HttpNode, HttpRequestAst } from "../parser/http-ast";
import httpFunctions from "../functions/http-functions";

export const completeHttp = (variables: { key: string, value: string }[]) => (context: CompletionContext) => {
    return computeHttpCompletions(context.pos,
        context.state.doc.toString(),
        (position: number) => context.state.doc.lineAt(position).number,
        variables)
}

export default completeHttp

export async function computeHttpCompletions(position: number, doc: string, lineAt: (position: number) => number, variables: { key: string, value: string }[] = []): Promise<CompletionResult> {
    const ast = computeHttpAst(doc)

    const node = findNodeAtPosition(position, ast)

    async function provideFunctionCompletions(expression: Expression) {
        if (expression.type === 'variable') {
            return {
                from: expression.from,
                options: variableCompletions(variables),
            }
        }

        if (expression.type == 'function') {

            if (position < expression.name.to) {
                return {
                    from: 0,
                    options: [],
                }
            }

            const arg = expression.args.find(arg => position >= arg.from && position <= arg.to)

            if (arg && arg.type == 'function') {
                return provideFunctionCompletions(arg)
            }

            const name = doc.slice(expression.name.from, expression.name.to)
            if (name == 'readText' || name == 'readFile') {

                const from = arg?.from || position
                const argText = arg ? doc.slice(arg.from, arg.to) : '/'
                const completions = await pathCompletion(argText)
                const result = {
                    from: from,
                    options: completions,
                }
                return result
            }

            return {
                from: arg?.from || position,
                options: [variableCompletions(variables), functionCompletions].flat(),
            }

        } else {
            return {
                from: expression.from,
                options: functionCompletions,
            }
        }
    }

    switch (node?.type) {
        case "method":
            return {
                from: node.from,
                options: methods,
            }
        case 'variable':
            const variableOptions = variableCompletions(variables)
            return {
                from: node.from,
                options: variableOptions,
            }
        case "header":
            const headerNode = node as HeaderNode
            if (position <= headerNode.key.to) {
                return {
                    from: headerNode.key.from,
                    options: [
                        bodySnippet,
                        ...headerCompletions
                    ],
                }
            } else {
                return provideFunctionCompletions(headerNode.value).then(result => {
                    const headerName = doc.slice(headerNode.key.from, headerNode.key.to).toLowerCase()
                    result.options = [headerName === 'content-type' ? contentTypeCompletions : [], result.options].flat()
                    return result
                })
            }
        case 'urlencoded':
        case 'multipart':
            const formNode = node as FormBodyNode
            const line = lineAt(position)
            const entry = formNode.entries.find(entry => line == lineAt(entry.from))
            if (entry?.separator && position > entry.separator) {
                return provideFunctionCompletions(entry.value)
            }
            break;
        case 'json':
            const jsonTree = json().language.parser.parse(doc)

            const jsonNode = jsonTree.resolveInner(position, -1)
            if (jsonNode.name === 'String') {
                return {
                    from: jsonNode.from + 1,
                    options: variableCompletions(variables),
                }
            }
            break;
    }
    return {
        from: 0,
        options: []
    }
}

export const methods = [
    { label: 'GET', type: "keyword" },
    { label: 'POST', type: "keyword" },
    { label: 'PUT', type: "keyword" },
    { label: 'DELETE', type: "keyword" },
    { label: 'PATCH', type: "keyword" },
    { label: 'HEAD', type: "keyword" },
    { label: 'OPTIONS', type: "keyword" },
]

export async function pathCompletion(path: string, fileStorage = DefaultFileStorage.getInstance()): Promise<Completion[]> {
    // TODO: handle Windows file separator
    const parent = path.substring(0, path.lastIndexOf('/')) || '/'
    const entries = await fileStorage.readDirectory(parent)
    return entries.map(entry => ({
        label: entry.path,
        type: 'text',
    }))
}

function findNodeAtPosition(position: number, ast: HttpRequestAst): HttpNode | undefined {
    const nodes = [ast.method, ...ast.url, ...ast.headers, ...(ast.body ? [ast.body] : [])]

    return nodes.find(node => position >= node.from && position <= node.to)
}

export function variableCompletions(variables: { key: string, value: string }[]): Completion[] {
    return variables.map(variable => ({
        displayLabel: variable.key,
        label: asVariable(variable.key),
        detail: variable.value,
        type: "variable"
    }))
}

export const functionCompletions = Array.from(httpFunctions.entries()).map(([name, fn]) => {
    const params = fn.parameters.map((p, i) => `\${${i + 1}:${p}}`).join(', ')

    return snippetCompletion(`${name}(${params})`, {
        label: name,
        detail: `(${fn.parameters.join(', ')})`,
        type: 'function'
    })
})

export const headerCompletions = httpHeaders.map(header => ({ label: `${header}:`, type: "keyword" }))

export const bodySnippet = snippetCompletion('@body\n\n{\n\t"${1}": ""\n}', {
    label: 'json body',
    type: 'text'
})

export const contentTypeCompletions = [
    // Text
    'text/html',
    'text/plain',
    'text/css',
    'text/csv',
    'text/javascript',

    // Application
    'application/json',
    'application/xml',
    'application/x-www-form-urlencoded',
    'application/octet-stream',

    // Image
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',

    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',

    // Video
    'video/mp4',
    'video/webm',

    // Multipart
    'multipart/form-data',
].map(contentType => ({ label: contentType, type: 'text' }));