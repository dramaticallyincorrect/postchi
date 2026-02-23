import { syntaxTree } from "@codemirror/language"
import { linter, Diagnostic } from "@codemirror/lint"
import { Tree } from "@lezer/common";
import { Text } from "@codemirror/state";
import { sliceInput } from "@/lib/utils/doc";
import { computeHttpAst } from "../parser/http-ast";

export const httpLinter = linter(view => {
    return computeHttpDiagnostics(syntaxTree(view.state), view.state.doc)
})

export function computeHttpDiagnostics(tree: Tree, doc: string | Text): Diagnostic[] {

    const { errors } = computeHttpAst(sliceInput(doc, 0, doc.length))

    return errors.map(error => errorDiagnostic(error.message, error.from, error.to))
}


export function errorDiagnostic(lint: HttpLint | string, from: number, to: number): Diagnostic {
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