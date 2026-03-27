import { EnvMutation } from './script-types';
import { updateEnvironmentVariable } from '../data/project/update-environment-variable';

export async function persistMutations(
    mutations: { envMutations: EnvMutation[]; secretMutations: EnvMutation[] },
    envPath: string,
    secretsPath: string,
    activeEnvironmentName: string,
): Promise<void> {
    for (const { key, value } of mutations.envMutations) {
        await updateEnvironmentVariable(envPath, activeEnvironmentName, key, value);
    }
    for (const { key, value } of mutations.secretMutations) {
        await updateEnvironmentVariable(secretsPath, activeEnvironmentName, key, value);
    }
}
