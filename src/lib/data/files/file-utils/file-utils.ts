import Result from "true-myth/result";
import DefaultFileStorage from "../file-default";

export async function readClosestFile(
    filename: string,
    path: string,
    stopAt?: string,
    storage = DefaultFileStorage.getInstance()
): Promise<Result<string, null>> {
    let currentDir = path.includes('.') ? path.substring(0, path.lastIndexOf('/')) : path

    while (currentDir) {
        try {
            const filePath = `${currentDir}/${filename}`
            const content = await storage.readText(filePath)
            return Result.ok(content)
        } catch {
            // File not found, move to parent directory
            if (stopAt && currentDir === stopAt) {
                break
            }

            const parentDir = currentDir.substring(0, currentDir.lastIndexOf('/'))
            if (parentDir === currentDir || !parentDir) {
                break
            }
            currentDir = parentDir
        }
    }

    return Result.err(null)
}

export function filename(path: string): string {
    const parts = path.split('/')
    return parts[parts.length - 1]
}

export function filenameWithoutExtension(path: string): string {
    return trimExtension(filename(path))
}

export function trimExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(0, lastDot) : filename;
}

export function parentDir(filePath: string): string {
    const sep = filePath.includes('\\') ? '\\' : '/';
    return filePath.substring(0, filePath.lastIndexOf(sep));
};