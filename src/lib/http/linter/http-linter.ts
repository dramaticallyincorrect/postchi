import { linter, Diagnostic } from "@codemirror/lint"
import { Text } from "@codemirror/state";
import { sliceInput } from "@/lib/utils/doc";
import { allNodes, computeHttpAst, Expression, HeaderNode, HttpNode } from "../parser/http-ast";

import { getVariableName, isVariable } from "@/lib/utils/variable-name";
import httpFunctions, { readFileFunction } from "../functions/http-functions";

export const httpLinter = (variables: { key: string, value: string }[] = []) => linter(view => {
  const diagnostics = computeHttpDiagnostics(view.state.doc, variables)
  return diagnostics
})

export function computeHttpDiagnostics(doc: string | Text, variables: { key: string, value: string }[] = []): Diagnostic[] {

  const slice = (node: HttpNode) => sliceInput(doc, node.from, node.to)

  const ast = computeHttpAst(sliceInput(doc, 0, doc.length))

  const diagnostics: Diagnostic[] = []

  const posOrLength = (pos: number) => Math.min(pos, doc.length)

  if (ast.url.length === 0) {
    diagnostics.push(errorDiagnostic(HttpErrorMessage.MissingUrl, posOrLength(ast.method.to + 1), posOrLength(ast.method.to + 1)))
  } else {
    const first = ast.url[0]
    const urlString = slice(first);
    if (!urlString.startsWith('/') && !urlString.startsWith("http://") && !urlString.startsWith("https://") && !urlString.startsWith("<")) {
      diagnostics.push(errorDiagnostic(HttpErrorMessage.WrongUrlProtocol, first.from, first.from))
    }
  }


  function checkVariable(node: HttpNode) {
    if (node.type === 'variable') {
      const nodeText = slice(node)
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

  function checkMissingKeyValue(headerNode: HeaderNode) {
    if (headerNode.key.from == headerNode.key.to) {
      diagnostics.push(errorDiagnostic(HttpErrorMessage.MissingKey, headerNode.key.from, headerNode.key.to));
    }
    if (!slice(headerNode.value).trim()) {
      const index = Math.max(headerNode.key.to, headerNode.separator ?? 0, headerNode.value.to)
      diagnostics.push(errorDiagnostic(HttpErrorMessage.MissingValue, index, index));
    }
  }

  function checkExpression(node: Expression) {
    if (node.type === 'function') {
      const name = slice(node.name)
      const fn = name === 'readFile' ? readFileFunction : httpFunctions.get(name)
      if (!fn) {
        diagnostics.push(errorDiagnostic(HttpErrorMessage.UnrecognizedFunction, node.from, node.to))
      } else if (!fn.isVarArgs) {
        if (fn.parameters.length > node.args.length) {
          diagnostics.push(errorDiagnostic(HttpErrorMessage.MissingParameters, node.from, node.to))
        } else if (fn.parameters.length < node.args.length) {
          diagnostics.push(errorDiagnostic(HttpErrorMessage.ExtraParameters, node.from, node.to))
        }
      }

    } else if (node.type === 'variable') {
      checkVariable(node)
    }
  }

  allNodes(ast).forEach(node => {
    if (node.type === 'function' || node.type === 'variable') {
      checkExpression(node)
    }else if (node.type === 'header') {
      checkMissingKeyValue(node)
    }
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
  } else if (body?.type === 'urlencoded') {
    body.entries.forEach(entry => {
      if (entry.value.type === 'function') {
        const name = slice(entry.value.name)
        if (name === 'readFile') {
          diagnostics.push(errorDiagnostic(HttpErrorMessage.UrlEncodedWithAttachedFile, entry.value.from, entry.value.to))
        }
      }
    })
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

export enum HttpErrorMessage {
  MissingUrl = "Missing URL",
  MissingKey = "Missing header key",
  WrongUrlProtocol = "URL should start with / for relative urls or http:// | https:// for absolute urls",
  MissingValue = "Missing header value",
  VariableNotDefined = "Variable not defined in the active environment",
  MalformedVariable = "variables should be in the format <variableName>",
  UrlEncodedWithAttachedFile = "URL encoded body cannot have files attached to it, consider using multipart form data instead",
  UnrecognizedFunction = "Unrecognized function",
  MissingParameters = "Missing function parameters",
  ExtraParameters = "Too many parameters provided to function"
}