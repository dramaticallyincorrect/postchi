import { syntaxTree } from "@codemirror/language"
import { linter, Diagnostic } from "@codemirror/lint"
import { Tree } from "@lezer/common";
import { Text } from "@codemirror/state";
import { isNodeEmpty, sliceInput } from "@/lib/utils/doc";

export const environmentLinter = linter(view => {
    return computeEnvironmentDiagnostics(syntaxTree(view.state), view.state.doc)
})

export function computeEnvironmentDiagnostics(tree: Tree, doc: string | Text): Diagnostic[] {
    let diagnostics: Diagnostic[] = []

    tree.cursor().iterate(node => {

        if (node.name === "Entry") {
            // only add no environment error for the first variable
            if (node.node.parent?.name !== "Environment" && (diagnostics.length == 0 || diagnostics[0].message !== EnvironmentLint.NoEnvironmentDefined)) {
                diagnostics.push(errorDiagnostic(EnvironmentLint.NoEnvironmentDefined, node.from, node.from))
            }
            const keyNode = node.node.getChild("Key")

            if (!keyNode || isNodeEmpty(keyNode, doc)) {
                diagnostics.push(errorDiagnostic(EnvironmentLint.MissingKey, node.from, node.from))
            }

            const valueNode = node.node.getChild("Value")

            if (!valueNode || isNodeEmpty(valueNode, doc)) {
                const from = valueNode ? valueNode.to : node.to - ((node.to - node.from) - sliceInput(doc, node.from, node.to).trim().length) 
                diagnostics.push(errorDiagnostic(EnvironmentLint.MissingValue, from, from))
            }

        }



    })


    return diagnostics
}


export function errorDiagnostic(lint: EnvironmentLint, from: number, to: number): Diagnostic {
    return {
        from,
        to,
        severity: "error",
        message: lint,
    }
}

export enum EnvironmentLint {
    NoEnvironmentDefined = "No environment defined",
    MissingKey = "Variable key is missing",
    MissingValue = "Variable value is missing",
}