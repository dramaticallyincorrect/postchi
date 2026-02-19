import { Text } from "@codemirror/state"
import { SyntaxNodeRef } from "@lezer/common"

export function isNodeEmpty(node: SyntaxNodeRef, input: string | Text) {
    return node.to === node.from || sliceInput(input, node.from, node.to).trim().length === 0
}

export function sliceInput(doc: string | Text, from: number, to: number) {
    if (typeof doc === "string") {
        return doc.slice(from, to)
    } else {
        return doc.sliceString(from, to)
    }
}