import { isTauri } from "@tauri-apps/api/core"
import { FileStorage, StorageEntry } from "../files/file"
import DefaultFileStorage from "../files/file-default"
import { readClosestFile } from "../files/file-utils/file-utils"
import { pathOf } from "../files/join"
import { FileType } from "../supported-filetypes"

export type Project = {
    name: string
    path: string
    postchiPath: string
    envPath: string
    secretsPath: string
    collectionsPath: string
    actionsPath: string
}

export async function createProject(path: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<Project> {
    const name = path.split('/').filter(Boolean).pop() ?? path
    await fileStorage.mkdir(path)
    await fileStorage.mkdir(pathOf(path, collectionsDirName))
    await fileStorage.mkdir(pathOf(path, actionsDirName))
    await fileStorage.mkdir(pathOf(path, postchiDirName))
    await createIfNotExists(pathOf(path, environmentsName + envExtension), fileStorage)
    await createIfNotExists(pathOf(path, secretsName + envExtension), fileStorage)
    await createIfNotExists(pathOf(path, postchiDirName, sourcesFileName), fileStorage, JSON.stringify({ sources: [] }, null, 2))
    return {
        name,
        path,
        postchiPath: pathOf(path, postchiDirName),
        envPath: pathOf(path, environmentsName + envExtension),
        secretsPath: pathOf(path, secretsName + envExtension),
        collectionsPath: pathOf(path, collectionsDirName),
        actionsPath: pathOf(path, actionsDirName),
    };
}

async function createIfNotExists(path: string, fileStorage: FileStorage, content?: string): Promise<void> {
    if (!await fileStorage.exists(path)) {
        await fileStorage.create(path, content)
    }
}

export async function createProjectFolder(path: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    return fileStorage.mkdir(path)
}

function sanitizeFilename(name: string): string {
    // Strip characters illegal on Windows, macOS, or Linux
    // Windows: \ / : * ? " < > |
    // macOS/Linux: / and null byte
    // Also strip control characters (0x00–0x1F)
    let sanitized = name
        .replace(/[/\\:*?"<>|]/g, ' ')   // illegal on Windows or path separators
        .replace(/[\x00-\x1F]/g, '')     // control characters
        .trim()
        .replace(/\.+$/, '')             // trailing dots (illegal on Windows)

    // Windows reserved names (e.g. CON, PRN, AUX, NUL, COM1–COM9, LPT1–LPT9)
    if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(sanitized)) {
        sanitized = `_${sanitized}`
    }

    return sanitized || '_'
}

export async function createHttpRequest(dir: string, name: string, content: string = 'GET http://', fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<string> {
    const safeName = sanitizeFilename(name.endsWith(FileType.HTTP) ? name.slice(0, -FileType.HTTP.length) : name)
    const filename = safeName + FileType.HTTP
    const path = pathOf(dir, filename)
    await fileStorage.create(path, content)
    return path
}

export async function createOrOverrideFolderSettings(folderPath: string, settings: FolderSettings = { baseUrl: '' }, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<string> {
    const path = pathOf(folderPath, 'settings.json')
    return fileStorage.create(path, JSON.stringify(settings)).then(() => path)
}

export async function readFolderSettings(folderPath: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<FolderSettings> {
    const content = await fileStorage.readText(pathOf(folderPath, 'settings.json'))
    return JSON.parse(content) as FolderSettings
}

export async function readSettingsForRequest(requestPath: string): Promise<FolderSettings> {
    const content = await readClosestFile('settings.json', requestPath)
    if (content.isErr) {
        return { baseUrl: '' }
    }
    return JSON.parse(content.value) as FolderSettings
}

export type FolderSettings = {
    baseUrl: string
}

export async function createQuickAction(actionsPath: string, name: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<string> {
    const filename = name.endsWith(FileType.QUICK_ACTION) ? name : name + FileType.QUICK_ACTION
    const path = pathOf(actionsPath, filename)
    await fileStorage.create(path, '// Quick Action\n// Available: env, fetch, setEnvironmentVariable(key, value)\n')
    return path
}

const collectionsDirName = "collections"
const actionsDirName = "actions"
const environmentsName = "environments"
const secretsName = "secrets"
const envExtension = '.cenv'
export const postchiDirName = ".postchi"
export const sourcesFileName = "sources.json"

export async function getDefaultProjectPath(): Promise<string> {
    if (isTauri()) {
        const { appDataDir } = await import('@tauri-apps/api/path')
        return `${await appDataDir()}/postchi-project`
    }
    return '/tmp/postchi-project'
}

export async function copyProject(
    source: Project,
    destPath: string,
    fileStorage: FileStorage = DefaultFileStorage.getInstance()
): Promise<Project> {
    await fileStorage.mkdir(destPath)
    await copyDirectory(source.path, destPath, fileStorage)
    return createProject(destPath)
}

async function copyDirectory(srcDir: string, destDir: string, fileStorage: FileStorage): Promise<void> {
    const entries: StorageEntry[] = await fileStorage.readDirectory(srcDir)
    for (const entry of entries) {
        const destEntryPath = pathOf(destDir, entry.filename)
        if (entry.isDirectory) {
            await fileStorage.mkdir(destEntryPath)
            await copyDirectory(entry.path, destEntryPath, fileStorage)
        } else {
            const content = await fileStorage.readText(entry.path)
            await fileStorage.create(destEntryPath, content)
        }
    }
}

export async function createTestProject(path: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<Project> {
    const project = await createProject(path, fileStorage)
    await createIfNotExists(pathOf(project.collectionsPath, 'settings.json'), fileStorage, `{"baseUrl": "https://httpbin.org"}`)
    await fileStorage.mkdir(pathOf(project.collectionsPath, 'top', 'nested', 'deep', 'down'))
    await createIfNotExists(pathOf(project.collectionsPath, 'users.get'), fileStorage, `POST https://httpbin.org/post
User-Agent: <user-agent>
Accept: application/json
Authorization: bearer(<token>)
@body
{
  "username": "<username>"
}`)
    await createIfNotExists(pathOf(project.collectionsPath, 'auth.get'), fileStorage, 'GET https://httpbin.org/get')
    return project
}