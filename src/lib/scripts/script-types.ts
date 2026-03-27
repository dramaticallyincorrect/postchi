import { HttpRequest, HttpResponse } from "../data/http/client/http-client";

// ── Types ────────────────────────────────────────────────────────────────

export type ScriptContextKind = 'before' | 'after' | 'quick-action';

export type ScriptRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
};

export type ScriptResponse = {
    status: number;
    headers: Record<string, string>;
    body: string | null;
};

export type EnvMutation = { key: string; value: string };

// ── Helpers ──────────────────────────────────────────────────────────────

export function buildScriptRequest(request: HttpRequest): ScriptRequest {
    const headersRecord: Record<string, string> = {};
    for (const [key, value] of request.headers) {
        headersRecord[key] = value;
    }
    return {
        method: request.method,
        url: request.url,
        headers: headersRecord,
        body: typeof request.body === 'string' ? request.body : null,
    };
}

export function buildScriptResponse(response: HttpResponse): ScriptResponse {
    return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: typeof response.body === 'string' ? response.body : null,
    };
}

export function buildEnv(variables: { key: string; value: string }[]): Record<string, string> {
    const env: Record<string, string> = {};
    for (const { key, value } of variables) {
        env[key] = value;
    }
    return env;
}

export function scriptPath(requestPath: string, fileType: string): string {
    const lastDot = requestPath.lastIndexOf('.');
    const base = lastDot !== -1 ? requestPath.substring(0, lastDot) : requestPath;
    return `${base}${fileType}`;
}
