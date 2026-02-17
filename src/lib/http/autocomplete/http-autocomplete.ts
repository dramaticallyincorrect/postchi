import { CompletionContext, CompletionResult } from "@codemirror/autocomplete"
import { syntaxTree } from "@codemirror/language"
import { httpHeaders } from "./http-headers"

export default function completeHttp(context: CompletionContext): CompletionResult | null {
    let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1)
    if (nodeBefore.name == "Key" && nodeBefore.parent?.name == "Header") {
        return {
            from: nodeBefore.from,
            options: headerCompletions
        }
    } else if (nodeBefore.name == "Value") {
        return {
            from: nodeBefore.from,
            options: functionCompletions
        }
    }
    return null
}

const functionCompletions = [{ label: 'basic()', type: "function" }, { label: 'bearer()', type: "function" }]

const headerCompletions = httpHeaders.map(header => ({ label: header, type: "keyword" }))