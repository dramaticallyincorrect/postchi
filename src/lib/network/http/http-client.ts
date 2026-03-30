import Task from "true-myth/task"
import { ContentTypeInfo } from "./body-classifier/http-body-classifier"

export interface HttpClient {
    fetch(request: HttpRequest, abortSignal: AbortSignal): Task<HttpResponse, HttpError>
}

export type HttpError = {
    type: 'network' | 'abort';
    message: string;
}

export type HttpResponse = {
    request: HttpRequest,
    raw: Response,
    status: number,
    headers: Headers,
    body: string | ArrayBuffer,
    contentTypeInfo: ContentTypeInfo
}

export type HttpRequest = {
    method: string,
    url: string,
    headers: [string, string][],
    body: string | URLSearchParams | FormData
}