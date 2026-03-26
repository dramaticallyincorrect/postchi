import Task from "true-myth/task";
import { HttpClient, HttpError, HttpRequest, HttpResponse } from "./http-client";
import { classifyResponseBody } from "../body-classifier/http-body-classifier";
import {fetch} from '@tauri-apps/plugin-http';

function inferContentType(body: HttpRequest['body']): string | null {
    if (body instanceof URLSearchParams) return 'application/x-www-form-urlencoded';
    if (body instanceof FormData) return null; // let the runtime set multipart boundary
    if (typeof body === 'string' && body.length > 0) {
        try { JSON.parse(body); return 'application/json'; } catch { return 'text/plain'; }
    }
    return null;
}

class TauriHttpClient implements HttpClient {
    fetch(request: HttpRequest, abortSignal: AbortSignal): Task<HttpResponse, HttpError> {
        return new Task(async (resolve, reject) => {
            try {
                const hasContentType = request.headers.some(
                    ([k]) => k.toLowerCase() === 'content-type'
                );
                const headers: [string, string][] = hasContentType || !request.body
                    ? request.headers
                    : (() => {
                        const inferred = inferContentType(request.body);
                        return inferred
                            ? [...request.headers, ['Content-Type', inferred]]
                            : request.headers;
                    })();

                const response = await fetch(request.url, {
                    method: request.method,
                    headers,
                    body: request.body || undefined,
                    signal: abortSignal
                });

                const contentTypeInfo = await classifyResponseBody(response);

                const body = contentTypeInfo.kind === 'binary' ? await response.arrayBuffer() : await response.text();

                resolve({
                    request: {
                        method: request.method,
                        url: request.url,
                        headers,
                        body: request.body
                    },
                    raw: response,
                    status: response.status,
                    headers: response.headers,
                    body,
                    contentTypeInfo
                });
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    reject({ type: 'abort', message: 'Request was aborted' });
                } else {
                    const message = error instanceof Error ? error.message : String(error);
                    reject({ type: 'network', message });
                }
            }
        });
    }
}

export default TauriHttpClient;