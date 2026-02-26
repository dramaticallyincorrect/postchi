import { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { httpHeaders } from "./http-headers"
import { computeHttpAst, FormBodyNode, HeaderNode, HttpNode, HttpRequestAst } from "../parser/http-ast"
import { EditorView } from "@uiw/react-codemirror"
import DefaultFileStorage from "@/lib/data/files/file-default"

export default async function completeHttp(context: CompletionContext): Promise<CompletionResult | null> {
    return await computeHttpCompletions(context.pos, context.state.doc.toString(), (position: number) => context.state.doc.lineAt(position).number)
}


export async function computeHttpCompletions(position: number, doc: string, lineAt: (position: number) => number): Promise<CompletionResult> {
    const ast = computeHttpAst(doc)

    const node = findNodeAtPosition(position, ast)

    if (!node) {
        if (position > ast.url[ast.url.length - 1].to && (ast.body == null || position < ast.body.from)) {
            return {
                from: position,
                options: headerCompletions,
            }
        }
    }

    switch (node?.type) {
        case "method":
            return {
                from: node.from,
                options: methods,
            }
        case "header":
            const headerNode = node as HeaderNode
            if (position <= headerNode.key.to) {
                return {
                    from: headerNode.key.from,
                    options: headerCompletions,
                }
            } else {
                return {
                    from: headerNode.value.from || position,
                    options: functionCompletions,
                }
            }
        case "form":
            const formNode = node as FormBodyNode
            const line = lineAt(position)
            const entry = formNode.entries.find(entry => line == lineAt(entry.from))
            if (entry?.separator && position > entry.separator) {

                if (entry.value.type == 'function') {


                    if (position < entry.value.name.to) {
                        return {
                            from: 0,
                            options: [],
                        }
                    }

                    const arg = entry.value.args.find(arg => position >= arg.from && position <= arg.to)

                    const name = doc.slice(entry.value.name.from, entry.value.name.to)
                    if (name == 'readText') {

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
                        from: entry.value.from || position,
                        options: functionCompletions,
                    }
                } else {
                    return {
                        from: entry.value.from,
                        options: functionCompletions,
                    }
                }

            }
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

export async function pathCompletion(path: string, fileStorage: FileStorage = new DefaultFileStorage()): Promise<Completion[]> {
    // TODO: handle Windows file separator
    const parent = path.substring(0, path.lastIndexOf('/')) || '/'
    const entries = await fileStorage.readDirectory(parent)
    return entries.map(entry => ({
        label: entry.path,
        type: 'text',
    }))
}

function findNodeAtPosition(position: number, ast: HttpRequestAst): HttpNode | undefined {
    const nodes = [ast.method, ...ast.url, ...ast.headers, ...ast.body ? [ast.body] : []]

    return nodes.find(node => position >= node.from && position <= node.to)
}

const functionApply = (view: EditorView, completion: Completion, from: number, to: number) => {
    view.dispatch({
        changes: { from, to, insert: completion.label },
        // place cursor before closing parenthesis
        selection: { anchor: from + completion.label.length - 1, head: from + completion.label.length - 1 }
    })
}

export const functionCompletions: Completion[] =
    [{
        label: 'basic()', type: "function", apply: functionApply
    }, { label: 'bearer()', type: "function", apply: functionApply }]

export const headerCompletions = httpHeaders.map(header => ({ label: header, type: "keyword" }))