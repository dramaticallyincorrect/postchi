import { ContentTypeInfo } from "@/lib/network/http/body-classifier/http-body-classifier";
import { HttpExecution } from "../runner/http-runner";

export type StoredResponse = {
    filePath: string;
    timestamp: number;
    status: number;
    durationMs: number;
    reqMethod: string;
    reqUrl: string;
    reqHeaders: [string, string][];
    reqBody: string;
    resHeaders: [string, string][];
    resBody: string | null;
    contentTypeInfo: ContentTypeInfo;
    afterScriptError?: string;
};

export function toStoredResponse(filePath: string, execution: HttpExecution): StoredResponse {
    const { response, durationInMillies, afterScriptError } = execution;
    const { request, status, headers, body, contentTypeInfo } = response;

    return {
        filePath,
        timestamp: Date.now(),
        status,
        durationMs: durationInMillies,
        reqMethod: request.method,
        reqUrl: request.url,
        reqHeaders: request.headers,
        reqBody: typeof request.body === 'string' ? request.body : '',
        resHeaders: Array.from(headers.entries()),
        resBody: contentTypeInfo.kind === 'text' && typeof body === 'string' ? body : null,
        contentTypeInfo,
        afterScriptError,
    };
}

export function toHttpExecution(stored: StoredResponse): HttpExecution {
    return {
        response: {
            request: {
                method: stored.reqMethod,
                url: stored.reqUrl,
                headers: stored.reqHeaders,
                body: stored.reqBody,
            },
            raw: new Response(),
            status: stored.status,
            headers: new Headers(stored.resHeaders),
            body: stored.resBody ?? '',
            contentTypeInfo: stored.contentTypeInfo,
        },
        durationInMillies: stored.durationMs,
        afterScriptError: stored.afterScriptError,
    };
}

export interface IResponseHistory {
    save(filePath: string, execution: HttpExecution): Promise<void>;
    getLatest(filePath: string): Promise<HttpExecution | null>;
}
