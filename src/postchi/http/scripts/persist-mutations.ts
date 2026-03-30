import { getProjectState } from "@/lib/project-state";
import { EnvMutation } from "./script-types";
import { updateEnvironmentVariable } from "@/postchi/project/update-environment-variable";

export async function persistMutations(
    mutations: { envMutations: EnvMutation[]; secretMutations: EnvMutation[] },
    state = getProjectState()
): Promise<void> {
    for (const { key, value } of mutations.envMutations) {
        await updateEnvironmentVariable(state.project.envPath, state.environment.name, key, value);
    }
    for (const { key, value } of mutations.secretMutations) {
        await updateEnvironmentVariable(state.project.secretsPath, state.environment.name, key, value);
    }
}
