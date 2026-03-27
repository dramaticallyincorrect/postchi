import { FileStorage } from '../data/files/file';
import DefaultFileStorage from '../data/files/file-default';
import { executeScript } from '../scripts/script-executor';
import { buildEnv, buildScriptResponse, EnvMutation, ScriptResponse } from '../scripts/script-types';
import { persistMutations } from '../scripts/persist-mutations';
import executeHttpTemplate from '../data/http/http-runner';
import { pathOf } from '../data/files/join';

export type QuickActionResult = {
    success: boolean;
    errorMessage?: string;
}

export async function executeQuickAction(
    scriptPath: string,
    variables: { key: string; value: string }[],
    envPath: string,
    secretsPath: string,
    activeEnvironmentName: string,
    collectionsPath: string,
    storage: FileStorage = DefaultFileStorage.getInstance()
): Promise<QuickActionResult> {
    const scriptContent = await storage.readText(scriptPath);

    const envMutations: EnvMutation[] = [];
    const secretMutations: EnvMutation[] = [];

    const executeRequest = async (relativePath: string): Promise<ScriptResponse> => {
        const absolutePath = pathOf(collectionsPath, relativePath);
        const template = await storage.readText(absolutePath);

        const result = await executeHttpTemplate(
            template,
            absolutePath,
            variables,
            new AbortController(),
            envPath,
            activeEnvironmentName,
            secretsPath,
        );
        if (result.isOk) {
            return buildScriptResponse(result.value.response);
        } else {
            throw new Error(result.error.message);
        }
    };

    try {
        const result = await executeScript({
            env: buildEnv(variables),
            fetch: globalThis.fetch,
            setEnvironmentVariable: (key: string, value: string) => envMutations.push({ key, value }),
            setSecret: (key: string, value: string) => secretMutations.push({ key, value }),
            executeRequest,
        }, scriptContent);

        await persistMutations({ envMutations, secretMutations }, envPath, secretsPath, activeEnvironmentName);

        return { success: !!result };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error executing quick action:', error);
        return { success: false, errorMessage: message };
    }
}
