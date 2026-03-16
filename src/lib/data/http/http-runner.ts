import Task from 'true-myth/task';
import resolveHttpTemplate from "./http-template-resolver";
import { FolderSettings, readSettingsForRequest } from "../project/project";
import { getVariableName, isVariable } from "@/lib/utils/variable-name";
import { executeBeforeScript } from "./before-script-executor";
import { executeAfterScript } from "./after-script-executor";
import { updateEnvironmentVariable } from "../project/update-environment-variable";
import { HttpRequest, HttpResponse } from './client/http-client';
import { createHttpClient } from './client/http-client-factory';
// import { fetch } from '@tauri-apps/plugin-http'

export class ExecutionError {
    type: 'network' | 'template' | 'abort' | 'script';
    message: string;

    constructor(type: 'network' | 'template' | 'abort' | 'script', message: string) {
        this.type = type;
        this.message = message;
    }
}

export default function executeHttpTemplate(template: string,
    templatePath: string,
    variables: { key: string, value: string }[],
    abort: AbortController, envPath: string = '',
    activeEnvironmentName: string = '',
    http = createHttpClient()): Task<HttpExecution, ExecutionError> {
    return new Task(async (resolve, reject) => {
        const vars = new Map(variables.map(obj => [obj.key, obj.value]))

        const request = await resolveHttpTemplate(template, {
            variables: vars,
            baseUrl: () => readBasePath(templatePath, vars)
        })

        if (!request || 'message' in request) {
            return reject(new ExecutionError('template', request.message));
        }

        let finalRequest: HttpRequest;
        try {
            finalRequest = await executeBeforeScript(templatePath, request, variables);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return reject(new ExecutionError('script', `Before script error: ${message}`));
        }

        const start = performance.now()
        const httpResult = await http.fetch(finalRequest, abort.signal);
        const end = performance.now();
        const durationInMillies = end - start;

        if (httpResult.isOk) {
            let afterScriptError: string | undefined;
            const response = httpResult.value;
            try {
                const scriptResponse = {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: typeof response.body === 'string' ? response.body : null,
                };
                const afterMutations = await executeAfterScript(templatePath, finalRequest, scriptResponse, variables);
                for (const { key, value } of afterMutations) {
                    await updateEnvironmentVariable(envPath, activeEnvironmentName, key, value);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                afterScriptError = `After script error: ${message}`;
            }

            resolve({
                response: response,
                durationInMillies,
                afterScriptError,
            })
        } else {
            reject(new ExecutionError(httpResult.error.type, httpResult.error.message));
        }
    })

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
    response: HttpResponse;
    durationInMillies: number;
    afterScriptError?: string;
}
