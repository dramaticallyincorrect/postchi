import { ScriptContextKind } from "@/postchi/http/scripts/script-types";
import { Completion } from "@codemirror/autocomplete";


// ── Autocomplete types ───────────────────────────────────────────────────

export type PropertyDescriptor = {
    name: string;
    completion: Completion;
    valueType?: 'string' | 'nullable-string' | 'number' | 'record';
};

export type ScriptContextEntry = {
    name: string;
    contexts: ScriptContextKind[];
    completion: Completion | ((ctx: ScriptContextKind) => Completion);
    properties?: PropertyDescriptor[] | ((ctx: ScriptContextKind) => PropertyDescriptor[]);
};

// ── Property descriptors ───────────────────────────────────────────────

const BEFORE_REQUEST_PROPS: PropertyDescriptor[] = [
    { name: 'method', completion: { label: 'method', type: 'property', detail: 'string', info: 'HTTP method, e.g. "GET"' }, valueType: 'string' },
    { name: 'url', completion: { label: 'url', type: 'property', detail: 'string', info: 'Full request URL' }, valueType: 'string' },
    { name: 'headers', completion: { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Request headers — access with request.headers["Content-Type"]' }, valueType: 'record' },
    { name: 'body', completion: { label: 'body', type: 'property', detail: 'string | null', info: 'Request body, or null for bodyless requests' }, valueType: 'nullable-string' },
];

const AFTER_REQUEST_PROPS: PropertyDescriptor[] = [
    { name: 'method', completion: { label: 'method', type: 'property', detail: 'string', info: 'HTTP method that was sent, e.g. "POST"' }, valueType: 'string' },
    { name: 'url', completion: { label: 'url', type: 'property', detail: 'string', info: 'URL the request was sent to' }, valueType: 'string' },
    { name: 'headers', completion: { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Headers that were sent with the request' }, valueType: 'record' },
    { name: 'body', completion: { label: 'body', type: 'property', detail: 'string | null', info: 'Body that was sent, or null for bodyless requests' }, valueType: 'nullable-string' },
];

const RESPONSE_PROPS: PropertyDescriptor[] = [
    { name: 'status', completion: { label: 'status', type: 'property', detail: 'number', info: 'HTTP status code, e.g. 200' }, valueType: 'number' },
    { name: 'headers', completion: { label: 'headers', type: 'property', detail: 'Record<string, string>', info: 'Response headers — access with response.headers["content-type"]' }, valueType: 'record' },
    { name: 'body', completion: { label: 'body', type: 'property', detail: 'string | null', info: 'Response body as text, or null for binary responses' }, valueType: 'nullable-string' },
];

// ── The registry (autocomplete only) ─────────────────────────────────────

export const SCRIPT_CONTEXT_ENTRIES: ScriptContextEntry[] = [
    {
        name: 'request',
        contexts: ['before', 'after'],
        completion: (ctx) => ctx === 'before'
            ? { label: 'request', type: 'variable', detail: 'ScriptRequest', info: 'Mutable request object — mutate its properties to change the request' }
            : { label: 'request', type: 'variable', detail: 'ScriptRequest', info: 'The request that was sent (read-only at this point)' },
        properties: (ctx) => ctx === 'before' ? BEFORE_REQUEST_PROPS : AFTER_REQUEST_PROPS,
    },
    {
        name: 'response',
        contexts: ['after'],
        completion: { label: 'response', type: 'variable', detail: 'ScriptResponse', info: 'The HTTP response — status, headers, body' },
        properties: RESPONSE_PROPS,
    },
    {
        name: 'env',
        contexts: ['before', 'after', 'quick-action'],
        completion: { label: 'env', type: 'variable', detail: 'Record<string, string>', info: 'Resolved environment variables' },
    },
    {
        name: 'fetch',
        contexts: ['before', 'after', 'quick-action'],
        completion: { label: 'fetch', type: 'function', detail: 'fetch(input, init?)', info: 'Make a sub-request' },
    },
    {
        name: 'setEnvironmentVariable',
        contexts: ['after', 'quick-action'],
        completion: { label: 'setEnvironmentVariable', type: 'function', detail: '(key: string, value: string): void', info: 'Set a variable in the active environment and persist it to the .cenv file' },
    },
    {
        name: 'setSecret',
        contexts: ['after', 'quick-action'],
        completion: { label: 'setSecret', type: 'function', detail: '(key: string, value: string): void', info: 'Set a secret in the active environment and persist it to the secrets file' },
    },
    {
        name: 'executeRequest',
        contexts: ['quick-action'],
        completion: { label: 'executeRequest', type: 'function', detail: '(path: string): Promise<Response>', info: 'Execute an HTTP request from the collections folder. Path is relative to the collections folder, e.g. "/api/login.get"' },
    },
    {
        name: 'console',
        contexts: ['before', 'after', 'quick-action'],
        completion: { label: 'console', type: 'variable', detail: 'Console', info: 'Browser console for debugging' },
    },
];
