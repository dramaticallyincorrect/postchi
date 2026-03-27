import { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { SCRIPT_CONTEXT_ENTRIES, ScriptContextKind } from "../script-context";

const STRING_METHODS: Completion[] = [
    { label: 'startsWith', type: 'method', detail: '(searchString: string): boolean' },
    { label: 'endsWith', type: 'method', detail: '(searchString: string): boolean' },
    { label: 'includes', type: 'method', detail: '(searchString: string): boolean' },
    { label: 'indexOf', type: 'method', detail: '(searchString: string): number' },
    { label: 'replace', type: 'method', detail: '(search: string | RegExp, replacement: string): string' },
    { label: 'replaceAll', type: 'method', detail: '(search: string, replacement: string): string' },
    { label: 'split', type: 'method', detail: '(separator: string): string[]' },
    { label: 'trim', type: 'method', detail: '(): string' },
    { label: 'trimStart', type: 'method', detail: '(): string' },
    { label: 'trimEnd', type: 'method', detail: '(): string' },
    { label: 'toUpperCase', type: 'method', detail: '(): string' },
    { label: 'toLowerCase', type: 'method', detail: '(): string' },
    { label: 'slice', type: 'method', detail: '(start: number, end?: number): string' },
    { label: 'substring', type: 'method', detail: '(start: number, end?: number): string' },
    { label: 'match', type: 'method', detail: '(regexp: RegExp): RegExpMatchArray | null' },
    { label: 'matchAll', type: 'method', detail: '(regexp: RegExp): IterableIterator<RegExpMatchArray>' },
    { label: 'padStart', type: 'method', detail: '(targetLength: number, padString?: string): string' },
    { label: 'padEnd', type: 'method', detail: '(targetLength: number, padString?: string): string' },
    { label: 'length', type: 'property', detail: 'number' },
];

// ── Completion helpers ─────────────────────────────────────────────────

function propCompletion(context: CompletionContext, pattern: RegExp, prefix: string, options: Completion[]): CompletionResult | null {
    const match = context.matchBefore(pattern);
    if (!match) return null;
    return { from: match.from + prefix.length, options };
}

function nullableBodyCompletion(context: CompletionContext, pattern: RegExp, prefix: string): CompletionResult | null {
    const match = context.matchBefore(pattern);
    if (!match) return null;
    const nullCheck = prefix.slice(0, -1); // strip trailing dot: "request.body." → "request.body"
    return {
        from: match.from + prefix.length,
        options: STRING_METHODS.map(opt =>
            opt.label === 'length' ? { ...opt, info: `Check for null first: if (${nullCheck} !== null)` } : opt
        ),
    };
}

function topLevelCompletion(context: CompletionContext, options: Completion[]): CompletionResult | null {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return { from: word.from, options };
}

// ── Build completion source from registry ──────────────────────────────

function buildCompletionSource(contextKind: ScriptContextKind) {
    const entries = SCRIPT_CONTEXT_ENTRIES.filter(e => e.contexts.includes(contextKind));

    return (context: CompletionContext): CompletionResult | null => {
        // Most-specific patterns first to avoid short patterns shadowing longer chains
        for (const entry of entries) {
            const props = typeof entry.properties === 'function'
                ? entry.properties(contextKind)
                : entry.properties;
            if (!props) continue;

            // Check string/nullable-string property completions (e.g. request.url.trim)
            for (const prop of props) {
                if (prop.valueType === 'string' || prop.valueType === 'nullable-string') {
                    const pattern = new RegExp(`${entry.name}\\.${prop.name}\\.\\w*`);
                    const prefix = `${entry.name}.${prop.name}.`;
                    const result = prop.valueType === 'nullable-string'
                        ? nullableBodyCompletion(context, pattern, prefix)
                        : propCompletion(context, pattern, prefix, STRING_METHODS);
                    if (result) return result;
                }
            }

            // Property-level completions (e.g. request.url, response.status)
            const propPattern = new RegExp(`${entry.name}\\.\\w*`);
            const propResult = propCompletion(context, propPattern, `${entry.name}.`, props.map(p => p.completion));
            if (propResult) return propResult;
        }

        // Top-level completions
        const topLevel = entries.map(e =>
            typeof e.completion === 'function' ? e.completion(contextKind) : e.completion
        );
        return topLevelCompletion(context, topLevel);
    };
}

export const beforeScriptCompletion = buildCompletionSource('before');
export const afterScriptCompletion = buildCompletionSource('after');
export const quickActionCompletion = buildCompletionSource('quick-action');
