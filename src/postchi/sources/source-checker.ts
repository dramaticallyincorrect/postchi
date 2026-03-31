import { fetchOpenApiSpec, convertDocumentToFolder } from "../import/open-api/open-api-parser"
import { ImportedFolder, ImportedRequest } from "../import/postman/postman-parser"
import { sanitizeFilename } from "../project/project"
import { Source, readSources } from "./sources"
import { Project } from "../project/project"
import { OpenAPIV3 } from "openapi-types"
import { mergeRequestContent } from "./source-merger"
import { FileStorage, StorageEntry } from "@/lib/storage/files/file"
import DefaultFileStorage from "@/lib/storage/files/file-default"
import { pathOf } from "@/lib/storage/files/join"
import { getSourceToken } from "@/lib/storage/store/credential-store"
import { FileType } from "../project/file-types/supported-filetypes"

export const SOURCE_SPEC_FILENAME = 'source.json'

export type ChangeKind = 'added' | 'removed' | 'modified'

export type SourceChange = {
    kind: ChangeKind
    path: string
    oldContent?: string
    newContent?: string
}

export type PendingSourceChanges = {
    source: Source
    changes: SourceChange[]
    remoteDoc: OpenAPIV3.Document
}

export async function checkSources(
    project: Project,
    fileStorage = DefaultFileStorage.getInstance()
): Promise<PendingSourceChanges[]> {
    const config = await readSources(project.path, fileStorage)
    const results: PendingSourceChanges[] = []

    for (const source of config.sources) {
        try {
            const sourceFolderPath = pathOf(project.collectionsPath, source.path)

            const token = source.authType
                ? await getSourceToken(project.path, source.path) ?? undefined
                : undefined
            const remoteDoc = await fetchOpenApiSpec(source.url, token)

            const remoteMap = flattenImportedFolder(convertDocumentToFolder(remoteDoc), sourceFolderPath)
            const diskMap = await readDiskFileMap(sourceFolderPath, fileStorage)

            const changes = diffMaps(remoteMap, diskMap)

            if (changes.length > 0) {
                results.push({ source, changes, remoteDoc })
            }
        } catch (e) {
            console.error(`[sources] Failed to check source "${source.url}":`, e)
        }
    }

    return results
}

export function diffSources(documentA: OpenAPIV3.Document, documentB: OpenAPIV3.Document, sourceFolderPath = ''): SourceChange[] {
    try {
        const localMap = flattenImportedFolder(convertDocumentToFolder(documentA), sourceFolderPath)
        const remoteMap = flattenImportedFolder(convertDocumentToFolder(documentB), sourceFolderPath)
        return diffMaps(remoteMap, localMap)
    } catch (e) {
        console.error(`[sources] Failed to diff sources:`, e)
        return []
    }
}

/** Recursively reads all .http request files from a source folder into a path → content map. */
async function readDiskFileMap(
    dirPath: string,
    fileStorage: FileStorage
): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    await collectDiskFiles(dirPath, map, fileStorage)
    return map
}

async function collectDiskFiles(
    dirPath: string,
    map: Map<string, string>,
    fileStorage: FileStorage
): Promise<void> {
    let entries: StorageEntry[]
    try {
        entries = await fileStorage.readDirectory(dirPath)
    } catch {
        return
    }

    for (const entry of entries) {
        if (entry.isDirectory) {
            await collectDiskFiles(entry.path, map, fileStorage)
        } else if (entry.filename.endsWith(FileType.HTTP)) {
            try {
                map.set(entry.path, await fileStorage.readText(entry.path))
            } catch {
                // skip unreadable files
            }
        }
    }
}

/** Flatten an ImportedFolder into a map of relative path → request content.
 *  The root folder is not included as a prefix — its items are the root level. */
function flattenImportedFolder(folder: ImportedFolder, prefix = ''): Map<string, string> {
    const map = new Map<string, string>()
    for (const item of folder.items) {
        if ('request' in item) {
            const req = item as ImportedRequest
            const filename = sanitizeFilename(req.name) + FileType.HTTP
            map.set(pathOf(prefix, filename), req.request)
        } else {
            const sub = item as ImportedFolder
            const subPrefix = pathOf(prefix, sanitizeFilename(sub.name))
            for (const [p, c] of flattenImportedFolder(sub, subPrefix)) {
                map.set(p, c)
            }
        }
    }
    return map
}

function diffMaps(remote: Map<string, string>, local: Map<string, string>): SourceChange[] {
    const changes: SourceChange[] = []

    for (const [path, newContent] of remote) {
        if (!local.has(path)) {
            changes.push({ kind: 'added', path, newContent })
        } else {
            const merged = mergeRequestContent(local.get(path) ?? '', newContent ?? '')
            if (local.get(path) !== merged) {
                changes.push({ kind: 'modified', path, oldContent: local.get(path), newContent: merged })
            }
        }
    }

    for (const [path, oldContent] of local) {
        if (!remote.has(path)) {
            changes.push({ kind: 'removed', path, oldContent })
        }
    }

    return changes
}
