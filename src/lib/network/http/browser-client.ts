import Task from "true-myth/task";
import { HttpClient, HttpError, HttpRequest, HttpResponse } from "./http-client";
import { classifyResponseBody } from "./body-classifier/http-body-classifier";

class BrowserClient implements HttpClient {
    fetch(request: HttpRequest, abortSignal: AbortSignal): Task<HttpResponse, HttpError> {
        return new Task(async (resolve, reject) => {
            try {
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body || undefined,
                    signal: abortSignal
                });

                const contentTypeInfo = await classifyResponseBody(response);

                const body = contentTypeInfo.kind === 'binary' ? await response.arrayBuffer() : await response.text();

                resolve({
                    request,
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

export default BrowserClient;