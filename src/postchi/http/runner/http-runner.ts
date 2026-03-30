import Task from 'true-myth/task';
import resolveHttpTemplate from "./http-template-resolver";
import { getVariableName, isVariable } from "@/lib/utils/variable-name";
import { getActiveEnvironment } from '@/lib/project-state';
import { HttpRequest, HttpResponse } from '@/lib/network/http/http-client';
import { createHttpClient } from '@/lib/network/http/http-client-factory';
import { FolderSettings, readSettingsForRequest } from '@/postchi/project/project';
import { executeAfterScript } from '../scripts/after/after-script-executor';
import { executeBeforeScript } from '../scripts/before/before-script-executor';
import { persistMutations } from '../scripts/persist-mutations';
import { buildScriptResponse } from '../scripts/script-types';

export class ExecutionError {
    type: 'network' | 'template' | 'abort' | 'script';
    message: string;

    constructor(type: 'network' | 'template' | 'abort' | 'script', message: string) {
        this.type = type;
        this.message = message;
    }
}

export default function executeHttpTemplate(
    template: string,
    templatePath: string,
    abort: AbortController,
    http = createHttpClient()): Task<HttpExecution, ExecutionError> {
    return new Task(async (resolve, reject) => {
        const environment = getActiveEnvironment()
        const variables = [
            environment?.variables ?? [],
            environment?.secrets ?? []
        ].flat()

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
                const scriptResponse = buildScriptResponse(response);
                const mutations = await executeAfterScript(templatePath, finalRequest, scriptResponse, variables);
                await persistMutations(mutations);
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
