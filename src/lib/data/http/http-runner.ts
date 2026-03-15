import Task from 'true-myth/task';
import { classifyResponseBody, ContentTypeInfo } from "./body-classifier/http-body-classifier";
import resolveHttpTemplate, { HttpRequest } from "./http-template-resolver";
import { FolderSettings, readSettingsForRequest } from "../project/project";
import { getVariableName, isVariable } from "@/lib/utils/variable-name";
import { executeBeforeScript } from "./before-script-executor";
import { executeAfterScript } from "./after-script-executor";
import { updateEnvironmentVariable } from "../project/update-environment-variable";
// import { fetch } from '@tauri-apps/plugin-http'

export class ExecutionError {
    type: 'network' | 'template' | 'abort' | 'script';
    message: string;

    constructor(type: 'network' | 'template' | 'abort' | 'script', message: string) {
        this.type = type;
        this.message = message;
    }
}

export default async function executeHttpTemplate(template: string, templatePath: string, variables: { key: string, value: string }[], abort: AbortController, envPath: string = '', activeEnvironmentName: string = ''): Promise<HttpExecution | ExecutionError> {

    const vars = new Map(variables.map(obj => [obj.key, obj.value]))
    
    const request = await resolveHttpTemplate(template, {
        variables: vars,
        baseUrl: () => readBasePath(templatePath, vars)
    })

    if (!request || 'message' in request) {
        return Promise.resolve(new ExecutionError('template', request.message));
    }

    let finalRequest: HttpRequest;
    try {
        const { request: modifiedRequest, envMutations: beforeMutations } = await executeBeforeScript(templatePath, request, variables);
        finalRequest = modifiedRequest;
        for (const { key, value } of beforeMutations) {
            await updateEnvironmentVariable(envPath, activeEnvironmentName, key, value);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new ExecutionError('script', `Before script error: ${message}`);
    }

    const start = performance.now()
    try {
        const response = await fetch(finalRequest.url, {
            method: finalRequest.method,
            headers: finalRequest.headers,
            body: finalRequest.body || undefined,
            signal: abort.signal
        });


        const end = performance.now();
        const durationInMillies = end - start;

        const contentTypeInfo = await classifyResponseBody(response);

        const body = contentTypeInfo.kind === 'binary' ? await response.arrayBuffer() : await response.text();

        const responseHeaders = Array.from(response.headers.entries()).map(([key, value]) => ({ key, value }));

        const scriptResponse = {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: typeof body === 'string' ? body : null,
            durationInMillies,
        };

        let afterScriptError: string | undefined;
        try {
            const afterMutations = await executeAfterScript(templatePath, finalRequest, scriptResponse, variables);
            for (const { key, value } of afterMutations) {
                await updateEnvironmentVariable(envPath, activeEnvironmentName, key, value);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            afterScriptError = `After script error: ${message}`;
        }

        return {
            status: response.status,
            durationInMillies,
            body: body,
            contentTypeInfo,
            headers: responseHeaders,
            request: finalRequest,
            afterScriptError,
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return Promise.resolve(new ExecutionError('abort', 'Request was aborted'));
        }
        return Promise.resolve(new ExecutionError('network', 'could not make the request, check your network connection'));
    }

}


export function readBasePath(requestPath: string, variables: Map<string, string> = new Map()): Task<string, { message: string }> {
    return new Task(async (resolve, reject) => {
        const settings: FolderSettings = await readSettingsForRequest(requestPath);
        if (settings && settings.baseUrl) {

            if (isVariable(settings.baseUrl)) {
                const variableName = getVariableName(settings.baseUrl);
                const variableValue = variables?.get(variableName);

                if (variableValue === undefined) {
                    reject({ message: 'variable set as base path is not defined in the active environment' });
                    return;
                } else {
                    resolve(removeTrailingSlash(variableValue));
                }
            }


            if (!(settings.baseUrl.startsWith('http://') || settings.baseUrl.startsWith('https://'))) {
                reject({ message: 'base path is not valid' });
            } else {
                resolve(removeTrailingSlash(settings.baseUrl));
            }
        } else {
            reject({ message: 'base path is not set' });
        }
    })
}

function removeTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}


export type HttpExecution = {
    status: number;
    durationInMillies: number;
    body: string | ArrayBuffer;
    contentTypeInfo: ContentTypeInfo;
    headers: { key: string, value: string }[];
    request: HttpRequest;
    afterScriptError?: string;
}
