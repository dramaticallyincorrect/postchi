import { FileStorage } from "../files/file";
import DefaultFileStorage from "../files/file-default";
import { FileType } from "../supported-filetypes";
import { HttpRequest } from "./http-template-resolver";

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

/**
 * Looks for a .before.js file next to the given .get request file and executes it.
 * The script receives a mutable `request` object, an `env` record, and `fetch`.
 * If no script file exists the original request is returned unchanged.
 * Throws if the script itself throws at runtime.
 */
export async function executeBeforeScript(
    requestPath: string,
    request: HttpRequest,
    variables: { key: string; value: string }[],
    storage: FileStorage = DefaultFileStorage.getInstance()
): Promise<HttpRequest> {
    const scriptPath = beforeScriptPath(requestPath);

    let scriptContent: string;
    try {
        scriptContent = await storage.readText(scriptPath);
    } catch {
        return request;
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
