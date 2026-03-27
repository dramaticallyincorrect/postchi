import { EnvMutation } from './script-types';
import { updateEnvironmentVariable } from '../data/project/update-environment-variable';
import { getProjectState, ProjectState } from '../project-state';

export async function persistMutations(
    mutations: { envMutations: EnvMutation[]; secretMutations: EnvMutation[] },
    state: ProjectState = getProjectState()
): Promise<void> {
    for (const { key, value } of mutations.envMutations) {
        await updateEnvironmentVariable(state.project.envPath, state.environment.name, key, value);
    }
    for (const { key, value } of mutations.secretMutations) {
        await updateEnvironmentVariable(state.project.secretsPath, state.environment.name, key, value);
    }
}
