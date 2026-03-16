import { FileStorage } from "../files/file";
import DefaultFileStorage from "../files/file-default";
import { FileType } from "../supported-filetypes";
import { readClosestFile } from "../files/file-utils/file-utils";
import { HttpRequest } from "./client/http-client";

export function beforeScriptPath(requestPath: string): string {
    const lastDot = requestPath.lastIndexOf('.');
    const base = lastDot !== -1 ? requestPath.substring(0, lastDot) : requestPath;
    return `${base}${FileType.BEFORE_SCRIPT}`;
}

type ScriptRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
}

async function runBeforeScriptContent(
    scriptContent: string,
    request: HttpRequest,
    variables: { key: string; value: string }[],
): Promise<HttpRequest> {
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

    const fn = new Function('request', 'env', 'fetch', `return (async () => { ${scriptContent} })()`);
    await fn(scriptRequest, env, globalThis.fetch);

    return {
        ...request,
        method: scriptRequest.method,
        url: scriptRequest.url,
        headers: Object.entries(scriptRequest.headers),
        body: scriptRequest.body !== null ? scriptRequest.body : request.body,
    };
}

/**
 * Executes before scripts for a request in order:
 * 1. Closest folder `before.js` (if any ancestor folder has one)
 * 2. Request-level `*.before.js` (if it exists next to the request file)
 * Mutations from both scripts are merged and returned together.
 * Throws if either script throws at runtime.
 */
export async function executeBeforeScript(
    requestPath: string,
    request: HttpRequest,
    variables: { key: string; value: string }[],
    storage: FileStorage = DefaultFileStorage.getInstance()
): Promise<HttpRequest> {
    let currentRequest = request;

    const folderScript = await readClosestFile(FileType.FOLDER_BEFORE_SCRIPT, requestPath, undefined, storage);
    if (folderScript.isOk) {
        const result = await runBeforeScriptContent(folderScript.value, currentRequest, variables);
        currentRequest = result;
    }

    let requestScriptContent: string;
    try {
        requestScriptContent = await storage.readText(beforeScriptPath(requestPath));
    } catch {
        return currentRequest;
    }

    const result = await runBeforeScriptContent(requestScriptContent, currentRequest, variables);


    return result;
}
