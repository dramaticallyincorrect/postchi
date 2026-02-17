import { CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { syntaxTree } from "@codemirror/language"
import { httpHeaders } from "./http-headers"

export default function completeHttp(context: CompletionContext): CompletionResult | null {
    let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1)
    const isSameLine = context.state.doc.lineAt(context.pos).number == context.state.doc.lineAt(nodeBefore.from).number
    // if it is on the same line and is a header it means there is a header key on this line and we are at a empty value postion so no header completion

    const from = nodeBefore.name == "Header" ? context.pos : nodeBefore.from
    if ((!isSameLine && nodeBefore.name == "Header") || (nodeBefore.name == "Key" && nodeBefore.parent?.name == "Header")) {
        return {
            from: from,
            options: headerCompletions
        }
    } else if (nodeBefore.name == "Header" || nodeBefore.name == "Value") {
        return {
            from: context.pos,
            options: functionCompletions
        }
    }
    return null
}

const functionCompletions = [{ label: 'basic()', type: "function" }, { label: 'bearer()', type: "function" }]

const headerCompletions = httpHeaders.map(header => ({ label: header, type: "keyword" }))