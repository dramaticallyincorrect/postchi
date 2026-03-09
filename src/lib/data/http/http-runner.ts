import { classifyResponseBody, ContentTypeInfo } from "./body-classifier/http-body-classifier";
import resolveHttpTemplate, { HttpRequest } from "./http-template-resolver";
// import { fetch } from '@tauri-apps/plugin-http'

export class ExecutionError {
    type: 'network' | 'template' | 'abort';
    message: string;

    constructor(type: 'network' | 'template' | 'abort', message: string) {
        this.type = type;
        this.message = message;
    }
}

export default async function executeHttpTemplate(template: string, variables: { key: string, value: string }[], abort: AbortController): Promise<HttpExecution | ExecutionError> {

    const request = await resolveHttpTemplate(template, {
        variables: new Map(variables.map(obj => [obj.key, obj.value])),
    })

    if (!request || 'message' in request) {
        return Promise.resolve(new ExecutionError('template', 'Invalid request, fix template and run again'));
    }

    const start = performance.now()
    try {
        const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body || undefined,
            signal: abort.signal
        });


        const end = performance.now();
        const durationInMillies = end - start;

        const contentTypeInfo = await classifyResponseBody(response);

        const body = contentTypeInfo.kind === 'binary' ? await response.arrayBuffer() : await response.text();

        return {
            status: response.status,
            durationInMillies,
            body: body,
            contentTypeInfo,
            headers: Array.from(response.headers.entries()).map(([key, value]) => ({ key, value })),
            request
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return Promise.resolve(new ExecutionError('abort', 'Request was aborted'));
        }
        return Promise.resolve(new ExecutionError('network', 'could not make the request, check your network connection'));
    }

}

export type HttpExecution = {
    status: number;
    durationInMillies: number;
    body: string | ArrayBuffer;
    contentTypeInfo: ContentTypeInfo;
    headers: { key: string, value: string }[];
    request: HttpRequest;
}
