import { Environment } from "../environments/parser/environments-parser";

export function serializeEnvironments(environments: Environment[]): string {
    return environments.map(env =>
        `# ${env.name}\n${env.variables.map(v => `${v.key}=${v.value}`).join('\n')}`
    ).join('\n\n');
}
