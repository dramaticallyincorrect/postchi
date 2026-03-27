import { FileStorage } from '../data/files/file';
import DefaultFileStorage from '../data/files/file-default';
import { executeScript } from '../scripts/script-executor';
import { buildEnv, buildScriptResponse, EnvMutation, ScriptResponse } from '../scripts/script-types';
import { persistMutations } from '../scripts/persist-mutations';
import executeHttpTemplate from '../data/http/http-runner';
import { pathOf } from '../data/files/join';
import { getProjectState } from '../project-state';

export type QuickActionResult = {
    success: boolean;
    errorMessage?: string;
}

export async function executeQuickAction(
    scriptPath: string,
    storage: FileStorage = DefaultFileStorage.getInstance(),
    state = getProjectState()
): Promise<QuickActionResult> {
    const scriptContent = await storage.readText(scriptPath);

    const envMutations: EnvMutation[] = [];
    const secretMutations: EnvMutation[] = [];

    const executeRequest = async (relativePath: string): Promise<ScriptResponse> => {
        const absolutePath = pathOf(state.project.collectionsPath, relativePath);
        const template = await storage.readText(absolutePath);

        const result = await executeHttpTemplate(
            template,
            absolutePath,
            new AbortController(),
        );

        if (result.isOk) {
            return buildScriptResponse(result.value.response);
        } else {
            throw new Error(result.error.message);
        }
    };

    try {
        // TODO: refactor to avoid the mapping
        await executeScript({
            env: buildEnv(state.environment.variables.concat(state.environment.secrets)),
            fetch: globalThis.fetch,
            setEnvironmentVariable: (key: string, value: string) => envMutations.push({ key, value }),
            setSecret: (key: string, value: string) => secretMutations.push({ key, value }),
            executeRequest,
        }, scriptContent);

        await persistMutations({ envMutations, secretMutations });

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error executing quick action:', error);
        return { success: false, errorMessage: message };
    }
}
