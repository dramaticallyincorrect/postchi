import { FileStorage } from "../files/file";
import DefaultFileStorage from "../files/file-default";
import { FileType } from "../supported-filetypes";
import { readClosestFile } from "../files/file-utils/file-utils";
import { HttpRequest } from "./client/http-client";

export function afterScriptPath(requestPath: string): string {
    const lastDot = requestPath.lastIndexOf('.');
    const base = lastDot !== -1 ? requestPath.substring(0, lastDot) : requestPath;
    return `${base}${FileType.AFTER_SCRIPT}`;
}

export type EnvMutation = { key: string; value: string };

type ScriptRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
}

export type ScriptResponse = {
    status: number;
    headers: Record<string, string>;
    body: string | null;
}

async function runAfterScriptContent(
    scriptContent: string,
    request: HttpRequest,
    response: ScriptResponse,
    variables: { key: string; value: string }[],
): Promise<EnvMutation[]> {
    const headersRecord: Record<string, string> = {};
    for (const [key, value] of request.headers) {
        headersRecord[key] = value;
    }

    const scriptRequest: ScriptRequest = {
        method: request.method,
        url: request.url,
        headers: headersRecord,
        body: typeof request.body === 'string' ? request.body : null,
    };

    const env: Record<string, string> = {};
    for (const { key, value } of variables) {
        env[key] = value;
    }

    const envMutations: EnvMutation[] = [];
    const setEnvironmentVariable = (key: string, value: string) => envMutations.push({ key, value });

    const fn = new Function('request', 'response', 'env', 'fetch', 'setEnvironmentVariable', `return (async () => { ${scriptContent} })()`);
    await fn(scriptRequest, response, env, globalThis.fetch, setEnvironmentVariable);

    return envMutations;
}

/**
 * Executes after scripts for a request in order:
 * 1. Request-level `*.after.js` (if it exists next to the request file)
 * 2. Closest folder `after.js` (if any ancestor folder has one)
 * Mutations from both scripts are merged and returned together.
 * Throws if either script throws at runtime.
 */
export async function executeAfterScript(
    requestPath: string,
    request: HttpRequest,
    response: ScriptResponse,
    variables: { key: string; value: string }[],
    storage: FileStorage = DefaultFileStorage.getInstance()
): Promise<EnvMutation[]> {
    const allMutations: EnvMutation[] = [];

    let requestScriptContent: string | null = null;
    try {
        requestScriptContent = await storage.readText(afterScriptPath(requestPath));
    } catch {
        // no request-level after script
    }

    if (requestScriptContent !== null) {
        const mutations = await runAfterScriptContent(requestScriptContent, request, response, variables);
        allMutations.push(...mutations);
    }

    const folderScript = await readClosestFile(FileType.FOLDER_AFTER_SCRIPT, requestPath, undefined, storage);
    if (folderScript.isOk) {
        const mutations = await runAfterScriptContent(folderScript.value, request, response, variables);
        allMutations.push(...mutations);
    }

    return allMutations;
}
