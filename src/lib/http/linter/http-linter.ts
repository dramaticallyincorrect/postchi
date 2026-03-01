import { linter, Diagnostic } from "@codemirror/lint"
import { Text } from "@codemirror/state";
import { sliceInput } from "@/lib/utils/doc";
import { computeHttpAst, HttpErrorMessage, HttpNode } from "../parser/http-ast";
import { Environment } from "@/lib/environments/parser/environments-parser";
import { getVariableName, isVariable } from "@/lib/utils/variable-name";

export const httpLinter = (environment?: Environment) => linter(view => {
  const diagnostics = computeHttpDiagnostics(view.state.doc, environment)
  return diagnostics
})

export function computeHttpDiagnostics(doc: string | Text, environment?: Environment): Diagnostic[] {

  const ast = computeHttpAst(sliceInput(doc, 0, doc.length))

  const diagnostics = ast.errors.map(error => errorDiagnostic(error.message, error.from, error.to))

  const variables = environment?.variables ?? []

  function checkVariable(node: HttpNode) {
    if (node.type === 'variable') {
      const nodeText = sliceInput(doc, node.from, node.to)
      if (!isVariable(nodeText)) {
        diagnostics.push(errorDiagnostic(HttpErrorMessage.MalformedVariable, node.from, node.to))
        return
      }

      const name = getVariableName(nodeText)
      const variable = variables.find(v => v.key === name)
      if (!variable) {
        diagnostics.push(errorDiagnostic(HttpErrorMessage.VariableNotDefined, node.from, node.to))
      }
    }
  }

  ast.headers.forEach(header => {
    checkVariable(header.value)
  })

  ast.url.forEach(url => {
    checkVariable(url)
  })

  const body = ast.body
  if (body && body.type === 'json') {

    const jsonText = sliceInput(doc, body.from, body.to);
    try {
      JSON.parse(jsonText);
    } catch (e: any) {
      diagnostics.push({
        from: body.from,
        to: body.to,
        severity: "error",
        message: e.message,
      });
    }
  }

  return diagnostics;
}


export function errorDiagnostic(lint: HttpErrorMessage | string, from: number, to: number): Diagnostic {
  return {
    from,
    to,
    severity: "error",
    message: lint,
  }
}