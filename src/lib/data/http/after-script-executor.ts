import { FileStorage } from "../files/file";
import DefaultFileStorage from "../files/file-default";
import { FileType } from "../supported-filetypes";
import { HttpRequest } from "./http-template-resolver";

export function afterScriptPath(requestPath: string): string {
    const lastDot = requestPath.lastIndexOf('.');
    const base = lastDot !== -1 ? requestPath.substring(0, lastDot) : requestPath;
    return `${base}${FileType.AFTER_SCRIPT}`;
}

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
    durationInMillies: number;
}

import { EnvMutation } from "./before-script-executor";

/**
 * Looks for a .after.js file next to the given .get request file and executes it.
 * The script receives the final (read-only) `request`, the `response`, an `env`
 * record, `fetch`, and `setEnvironmentVariable`. Common uses: assertions, logging,
 * storing response tokens. If no script file exists the function returns without doing anything.
 * Throws if the script itself throws at runtime.
 */
export async function executeAfterScript(
    requestPath: string,
    request: HttpRequest,
    response: ScriptResponse,
    variables: { key: string; value: string }[],
    storage: FileStorage = DefaultFileStorage.getInstance()
): Promise<EnvMutation[]> {
    const scriptPath = afterScriptPath(requestPath);

    let scriptContent: string;
    try {
        scriptContent = await storage.readText(scriptPath);
    } catch {
        return [];
    }

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
