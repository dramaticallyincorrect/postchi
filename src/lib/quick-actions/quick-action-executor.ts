import { FileStorage } from '../data/files/file';
import DefaultFileStorage from '../data/files/file-default';
import { EnvMutation } from '../data/http/after-script-executor';

export type QuickActionResult = {
    success: boolean;
    mutations: EnvMutation[];
}

export async function executeQuickAction(
    scriptPath: string,
    variables: { key: string; value: string }[],
    storage: FileStorage = DefaultFileStorage.getInstance()
): Promise<QuickActionResult> {
    const scriptContent = await storage.readText(scriptPath);

    const env: Record<string, string> = {};
    for (const { key, value } of variables) {
        env[key] = value;
    }

    const envMutations: EnvMutation[] = [];
    const setEnvironmentVariable = (key: string, value: string) => envMutations.push({ key, value });

    try {
        const fn = new Function('env', 'fetch', 'setEnvironmentVariable', `return (async () => { 
             ${scriptContent} 
             })()`);
        const result = await fn(env, globalThis.fetch, setEnvironmentVariable);
        return { success: result, mutations: envMutations };
    } catch (error) {
        console.error('Error executing quick action:', error);
        return { success: false, mutations: [] };
    }
}
