import { syntaxTree } from "@codemirror/language"
import { linter, Diagnostic } from "@codemirror/lint"
import { Tree } from "@lezer/common";
import { Text } from "@codemirror/state";
import { isNodeEmpty, sliceInput } from "@/lib/utils/doc";

export const httpLinter = linter(view => {
    return computeHttpDiagnostics(syntaxTree(view.state), view.state.doc)
})

export function computeHttpDiagnostics(tree: Tree, doc: string | Text): Diagnostic[] {
    let diagnostics: Diagnostic[] = []
    var hasMethod = false;
    tree.cursor().iterate(node => {
        if (node.name == "RequestLine") {
            const method = node.node.getChild('Method')
            if (!method) {
                diagnostics.push(errorDiagnostic(HttpLint.MissingMethod, 0, 0))
            }

            const url = node.node.getChild('Path')
            if (!url) {
                diagnostics.push(errorDiagnostic(HttpLint.MissingUrl, node.to, node.to))
            }
        }

        if (node.name == "Header" && !isNodeEmpty(node, doc)) {
            const key = node.node.getChild('Key')
            if (!key || sliceInput(doc, key.from, key.to).trim().length == 0) {
                diagnostics.push(errorDiagnostic(HttpLint.MissingHeaderName, node.from, node.from))
            }

            const value = node.node.getChild('Value') || node.node.getChild('Function') || node.node.getChild('Variable')
            if (!value) {
                diagnostics.push(errorDiagnostic(HttpLint.MissingHeaderValue, node.to, node.to))
            }
        }

        if (node.name == "Method") hasMethod = true;
    })


    return diagnostics
}


export function errorDiagnostic(lint: HttpLint, from: number, to: number): Diagnostic {
    return {
        from,
        to,
        severity: "error",
        message: lint,
    }
}

export enum HttpLint {
    MissingMethod = "HTTP method is missing",
    MissingUrl = "URL is missing",
    MissingHeaderValue = "Header value is missing",
    MissingHeaderName = "Header name is missing"
}