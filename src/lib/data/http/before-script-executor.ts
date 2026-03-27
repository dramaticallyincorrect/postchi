import { FileStorage } from "../files/file";
import DefaultFileStorage from "../files/file-default";
import { FileType } from "../supported-filetypes";
import { readClosestFile } from "../files/file-utils/file-utils";
import { HttpRequest } from "./client/http-client";
import { buildScriptRequest, buildEnv, scriptPath, ScriptRequest } from "../../scripts/script-types";
import { executeScript } from "../../scripts/script-executor";

export function beforeScriptPath(requestPath: string): string {
    return scriptPath(requestPath, FileType.BEFORE_SCRIPT);
}

async function runBeforeScriptContent(
    scriptContent: string,
    request: HttpRequest,
    variables: { key: string; value: string }[],
): Promise<HttpRequest> {
    const scriptRequest: ScriptRequest = buildScriptRequest(request);

    await executeScript({
        request: scriptRequest,
        env: buildEnv(variables),
        fetch: globalThis.fetch,
    }, scriptContent);

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
