import DefaultFileStorage from "@/lib/storage/files/file-default";
import { FileStorage } from "@/lib/storage/files/file";

export type EnvEntry = {
    envName: string;
    key: string;
    value: string;
}

/**
 * Appends key=value entries to environments.cenv, creating sections as needed.
 * Existing sections are extended; missing sections are appended at the end.
 * Non-destructive: never removes existing entries.
 */
export async function appendEnvironmentVariables(
    envPath: string,
    entries: EnvEntry[],
    fileStorage: FileStorage = DefaultFileStorage.getInstance()
): Promise<void> {
    const exists = await fileStorage.exists(envPath);
    let content = exists ? await fileStorage.readText(envPath) : '';

    for (const entry of entries) {
        content = appendEntry(content, entry);
    }

    await fileStorage.writeText(envPath, content);
}

function appendEntry(content: string, entry: EnvEntry): string {
    const sectionHeader = `# ${entry.envName}`;
    const newVar = `${entry.key}=${entry.value}`;

    // Normalise: work with lines without a trailing empty element
    const lines = content.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();

    const sectionIndex = lines.findIndex(l => l.trim() === sectionHeader);

    if (sectionIndex === -1) {
        // Section doesn't exist — append a blank-line separator, the header, and the var
        if (lines.length > 0) lines.push('');
        lines.push(sectionHeader);
        lines.push(newVar);
        lines.push('');
        return lines.join('\n');
    }

    // Section exists — insert after the last entry in this section (before next # or EOF)
    let insertAt = sectionIndex + 1;
    while (insertAt < lines.length && !lines[insertAt].trim().startsWith('#')) {
        insertAt++;
    }

    lines.splice(insertAt, 0, newVar);
    return lines.join('\n') + '\n';
}
