import DefaultFileStorage from "@/lib/storage/files/file-default";
import { serializeEnvironments } from "./serialize-environments";
import parseEnvironments from "../environments/parser/environments-parser";

export async function updateEnvironmentVariable(
    envPath: string,
    environmentName: string,
    key: string,
    value: string,
    storage = DefaultFileStorage.getInstance()
): Promise<void> {
    const text = await storage.readText(envPath);
    const environments = parseEnvironments(text);

    const env = environments.find(e => e.name === environmentName);
    if (!env) return;

    const existing = env.variables.find(v => v.key === key);
    if (existing) {
        existing.value = value;
    } else {
        env.variables.push({ key, value });
    }

    await storage.writeText(envPath, serializeEnvironments(environments));
}
