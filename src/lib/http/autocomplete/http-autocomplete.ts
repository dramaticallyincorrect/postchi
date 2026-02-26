import { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { httpHeaders } from "./http-headers"
import { computeHttpAst, FormBodyNode, HeaderNode, HttpNode, HttpRequestAst } from "../parser/http-ast"
import { EditorView } from "@uiw/react-codemirror"

export default function completeHttp(context: CompletionContext): CompletionResult | null {
    return computeHttpCompletions(context.pos, context.state.doc.toString())
}


export function computeHttpCompletions(position: number, doc: string): CompletionResult {
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
            const entry = formNode.entries.find(entry => position > entry.separator && entry.value == null || (position >= entry.value.from && position <= entry.value.to))
            if (entry) {
                return {
                    from: entry.value.from || position,
                    options: functionCompletions,
                }
            }

    }

    return {
        from: 0,
        options: []
    }
}

const methods = [
    { label: 'GET', type: "keyword" },
    { label: 'POST', type: "keyword" },
    { label: 'PUT', type: "keyword" },
    { label: 'DELETE', type: "keyword" },
    { label: 'PATCH', type: "keyword" },
    { label: 'HEAD', type: "keyword" },
    { label: 'OPTIONS', type: "keyword" },
]


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