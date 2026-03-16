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

const SHARED_GLOBALS: Completion[] = [
    { label: 'env', type: 'variable', detail: 'Record<string, string>', info: 'Resolved environment variables' },
    { label: 'fetch', type: 'function', detail: 'fetch(input, init?)', info: 'Make a sub-request' },
    { label: 'console', type: 'variable', detail: 'Console', info: 'Browser console for debugging' },
];

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

const BEFORE_REQUEST_PROPS: Completion[] = [
    { label: 'method', type: 'property', detail: 'string', info: 'HTTP method, e.g. "GET"' },
    { label: 'url', type: 'property', detail: 'string', info: 'Full request URL' },
    { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Request headers — access with request.headers["Content-Type"]' },
    { label: 'body', type: 'property', detail: 'string | null', info: 'Request body, or null for bodyless requests' },
];

const AFTER_REQUEST_PROPS: Completion[] = [
    { label: 'method', type: 'property', detail: 'string', info: 'HTTP method that was sent, e.g. "POST"' },
    { label: 'url', type: 'property', detail: 'string', info: 'URL the request was sent to' },
    { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Headers that were sent with the request' },
    { label: 'body', type: 'property', detail: 'string | null', info: 'Body that was sent, or null for bodyless requests' },
];

const RESPONSE_PROPS: Completion[] = [
    { label: 'status', type: 'property', detail: 'number', info: 'HTTP status code, e.g. 200' },
    { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Response headers — access with response.headers["content-type"]' },
    { label: 'body', type: 'property', detail: 'string | null', info: 'Response body as text, or null for binary responses' },
];

// Patterns are matched most-specific first to avoid short patterns shadowing
// longer chains (e.g. `request.url.` before `request.`).
export function beforeScriptCompletion(context: CompletionContext): CompletionResult | null {
    return (
        propCompletion(context, /request\.url\.\w*/, 'request.url.', STRING_METHODS) ??
        propCompletion(context, /request\.method\.\w*/, 'request.method.', STRING_METHODS) ??
        nullableBodyCompletion(context, /request\.body\.\w*/, 'request.body.') ??
        propCompletion(context, /request\.\w*/, 'request.', BEFORE_REQUEST_PROPS) ??
        topLevelCompletion(context, [
            { label: 'request', type: 'variable', detail: 'ScriptRequest', info: 'Mutable request object — mutate its properties to change the request' },
            ...SHARED_GLOBALS,
        ])
    );
}

export function afterScriptCompletion(context: CompletionContext): CompletionResult | null {
    return (
        nullableBodyCompletion(context, /response\.body\.\w*/, 'response.body.') ??
        propCompletion(context, /response\.\w*/, 'response.', RESPONSE_PROPS) ??
        propCompletion(context, /request\.url\.\w*/, 'request.url.', STRING_METHODS) ??
        propCompletion(context, /request\.method\.\w*/, 'request.method.', STRING_METHODS) ??
        propCompletion(context, /request\.\w*/, 'request.', AFTER_REQUEST_PROPS) ??
        topLevelCompletion(context, [
            { label: 'response', type: 'variable', detail: 'ScriptResponse', info: 'The HTTP response — status, headers, body' },
            { label: 'request', type: 'variable', detail: 'ScriptRequest', info: 'The request that was sent (read-only at this point)' },
            ...SHARED_GLOBALS,
            { label: 'setEnvironmentVariable', type: 'function', detail: '(key: string, value: string): void', info: 'Set a variable in the active environment and persist it to the .cenv file' },
        ])
    );
}
