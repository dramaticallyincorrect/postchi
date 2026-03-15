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
// longer chains (e.g. `response.body.` before `response.`).
export default function afterScriptCompletion(context: CompletionContext): CompletionResult | null {
    // response.body.<cursor>  — String methods on body (can be null)
    const responseBodyProp = context.matchBefore(/response\.body\.\w*/);
    if (responseBodyProp) {
        return {
            from: responseBodyProp.from + 'response.body.'.length,
            options: STRING_METHODS.map(opt =>
                opt.label === 'length'
                    ? { ...opt, info: 'Check for null first: if (response.body !== null)' }
                    : opt
            ),
        };
    }

    // response.<cursor>  — ScriptResponse properties
    const responseProp = context.matchBefore(/response\.\w*/);
    if (responseProp) {
        return {
            from: responseProp.from + 'response.'.length,
            options: [
                { label: 'status', type: 'property', detail: 'number', info: 'HTTP status code, e.g. 200' },
                { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Response headers — access with response.headers["content-type"]' },
                { label: 'body', type: 'property', detail: 'string | null', info: 'Response body as text, or null for binary responses' },
                { label: 'durationInMillies', type: 'property', detail: 'number', info: 'Round-trip time in milliseconds' },
            ],
        };
    }

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

    // request.<cursor>  — final request properties (read-only; already sent)
    const requestProp = context.matchBefore(/request\.\w*/);
    if (requestProp) {
        return {
            from: requestProp.from + 'request.'.length,
            options: [
                { label: 'method', type: 'property', detail: 'string', info: 'HTTP method that was sent, e.g. "POST"' },
                { label: 'url', type: 'property', detail: 'string', info: 'URL the request was sent to' },
                { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Headers that were sent with the request' },
                { label: 'body', type: 'property', detail: 'string | null', info: 'Body that was sent, or null for bodyless requests' },
            ],
        };
    }

    // Top-level word  — injected globals
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    return {
        from: word.from,
        options: [
            { label: 'response', type: 'variable', detail: 'ScriptResponse', info: 'The HTTP response — status, headers, body, durationInMillies' },
            { label: 'request', type: 'variable', detail: 'ScriptRequest', info: 'The request that was sent (read-only at this point)' },
            { label: 'env', type: 'variable', detail: 'Record<string, string>', info: 'Resolved environment variables' },
            { label: 'fetch', type: 'function', detail: 'fetch(input, init?)', info: 'Make a follow-up request' },
            { label: 'console', type: 'variable', detail: 'Console', info: 'Browser console for debugging' },
        ],
    };
}
