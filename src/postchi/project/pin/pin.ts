import DefaultFileStorage from "@/lib/storage/files/file-default";
import { pinnedPathForProject } from "../project";

export async function addToPinned(path: string, project: string, fileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    const pinnedPath = pinnedPathForProject(project)
    if (!fileStorage.exists(pinnedPath)) {
        fileStorage.create(pinnedPath, '')
        fileStorage.writeText(pinnedPath, '')
    }

    const relativePath = relative(path, project)
    return fileStorage.writeText(pinnedPath, relativePath + '\n', true)
}

export async function removePinned(path: string, project: string, fileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    const pinnedPath = pinnedPathForProject(project)
    if (!fileStorage.exists(pinnedPath)) {
        return
    }

    const relativePath = relative(path, project)
    return fileStorage.readText(pinnedPath).then(content => {
        const lines = content.split('\n').filter(line => line !== relativePath)
        return fileStorage.writeText(pinnedPath, lines.join('\n'))
    })
}

function relative(path: string, project: string) {
    return path.startsWith(project) ? path.slice(project.length).replace(/^\//, '') : path
}