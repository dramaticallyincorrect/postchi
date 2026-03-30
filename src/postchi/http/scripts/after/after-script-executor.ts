import { buildEnv, buildScriptRequest, EnvMutation, scriptPath, ScriptResponse } from "../script-types";
import { HttpRequest } from "@/lib/network/http/http-client";
import { executeScript } from "../executer/script-executor";
import DefaultFileStorage from "@/lib/storage/files/file-default";
import { FileStorage } from "@/lib/storage/files/file";
import { readClosestFile } from "@/lib/storage/files/file-utils/file-utils";
import { FileType } from "@/postchi/project/file-types/supported-filetypes";


export function afterScriptPath(requestPath: string): string {
    return scriptPath(requestPath, FileType.AFTER_SCRIPT);
}

export type AfterScriptMutations = {
    envMutations: EnvMutation[];
    secretMutations: EnvMutation[];
};

async function runAfterScriptContent(
    scriptContent: string,
    request: HttpRequest,
    response: ScriptResponse,
    variables: { key: string; value: string }[],
    envMutations: EnvMutation[],
    secretMutations: EnvMutation[],
): Promise<void> {
    await executeScript({
        request: buildScriptRequest(request),
        response,
        env: buildEnv(variables),
        fetch: globalThis.fetch,
        setEnvironmentVariable: (key: string, value: string) => envMutations.push({ key, value }),
        setSecret: (key: string, value: string) => secretMutations.push({ key, value }),
    }, scriptContent);
}

/**
 * Executes after scripts for a request in order:
 * 1. Request-level `*.after.js` (if it exists next to the request file)
 * 2. Closest folder `after.js` (if any ancestor folder has one)
 * Both scripts share the same mutation arrays — all mutations are returned together.
 * Throws if either script throws at runtime.
 */
export async function executeAfterScript(
    requestPath: string,
    request: HttpRequest,
    response: ScriptResponse,
    variables: { key: string; value: string }[],
    storage: FileStorage = DefaultFileStorage.getInstance()
): Promise<AfterScriptMutations> {
    const envMutations: EnvMutation[] = [];
    const secretMutations: EnvMutation[] = [];

    let requestScriptContent: string | null = null;
    try {
        requestScriptContent = await storage.readText(afterScriptPath(requestPath));
    } catch {
        // no request-level after script
    }

    if (requestScriptContent !== null) {
        await runAfterScriptContent(requestScriptContent, request, response, variables, envMutations, secretMutations);
    }

    const folderScript = await readClosestFile(FileType.FOLDER_AFTER_SCRIPT, requestPath, undefined, storage);
    if (folderScript.isOk) {
        await runAfterScriptContent(folderScript.value, request, response, variables, envMutations, secretMutations);
    }

    return { envMutations, secretMutations };
}
