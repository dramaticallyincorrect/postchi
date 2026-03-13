import Result from "true-myth/result";
import DefaultFileStorage from "../file-default";

export async function readClosestFile(
    filename: string,
    path: string,
    stopAt?: string,
    storage: DefaultFileStorage = DefaultFileStorage.getInstance()
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