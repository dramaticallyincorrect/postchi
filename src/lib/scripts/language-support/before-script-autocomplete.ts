import { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";

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



// Patterns are matched most-specific first to avoid short patterns shadowing
// longer chains (e.g. `request.url.` before `request.`).
export default function beforeScriptCompletion(context: CompletionContext): CompletionResult | null {
    // request.url.<cursor>  — String methods on url
    const requestUrlProp = context.matchBefore(/request\.url\.\w*/);
    if (requestUrlProp) {
        return { from: requestUrlProp.from + 'request.url.'.length, options: STRING_METHODS };
    }

    // request.method.<cursor>  — String methods on method
    const requestMethodProp = context.matchBefore(/request\.method\.\w*/);
    if (requestMethodProp) {
        return { from: requestMethodProp.from + 'request.method.'.length, options: STRING_METHODS };
    }

    // request.body.<cursor>  — String methods on body (body can be null; user must guard)
    const requestBodyProp = context.matchBefore(/request\.body\.\w*/);
    if (requestBodyProp) {
        return {
            from: requestBodyProp.from + 'request.body.'.length,
            options: STRING_METHODS.map(opt =>
                opt.label === 'length'
                    ? { ...opt, info: 'Check for null first: if (request.body !== null)' }
                    : opt
            ),
        };
    }

    // request.<cursor>  — ScriptRequest properties
    const requestProp = context.matchBefore(/request\.\w*/);
    if (requestProp) {
        return {
            from: requestProp.from + 'request.'.length,
            options: [
                { label: 'method', type: 'property', detail: 'string', info: 'HTTP method, e.g. "GET"' },
                { label: 'url', type: 'property', detail: 'string', info: 'Full request URL' },
                { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Request headers — access with request.headers["Content-Type"]' },
                { label: 'body', type: 'property', detail: 'string | null', info: 'Request body, or null for bodyless requests' },
            ],
        };
    }

    // Top-level word  — injected globals
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    return {
        from: word.from,
        options: [
            { label: 'request', type: 'variable', detail: 'ScriptRequest', info: 'Mutable request object — mutate its properties to change the request' },
            { label: 'env', type: 'variable', detail: 'Record<string, string>', info: 'Resolved environment variables' },
            { label: 'fetch', type: 'function', detail: 'fetch(input, init?)', info: 'Make a sub-request before the main one' },
            { label: 'console', type: 'variable', detail: 'Console', info: 'Browser console for debugging' },
        ],
    };
}