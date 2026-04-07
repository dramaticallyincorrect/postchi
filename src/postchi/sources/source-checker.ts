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
import { RequestSpec } from "./request-spec"
import { getActiveProject } from "@/lib/project-state"

export const SOURCE_SPEC_FILENAME = 'source.yaml'

export type ChangeKind = 'added' | 'removed' | 'modified'

//TODO: path should be absolute to not need the project, in general we save on disk relative but once read should exist as absolute
export type SourceChange = {
    kind: ChangeKind
    path: string
    oldContent?: string
    newContent?: string
    spec?: RequestSpec  // present for 'added' and 'modified'
}

export type PendingSourceChanges = {
    source: Source
    changes: SourceChange[]
    remoteDoc: OpenAPIV3.Document
}

export type SourceCheckResult = {
    changes: PendingSourceChanges[]
    authErrors: SourceSyncError[]
}

export type SourceSyncError = {
    source: Source,
    error: string
}

export async function checkSources(
    project: Project = getActiveProject()!,
    fileStorage = DefaultFileStorage.getInstance()
): Promise<SourceCheckResult> {
    const config = await readSources(project.path, fileStorage)
    const results: PendingSourceChanges[] = []
    const authErrors: SourceSyncError[] = []

    for (const source of config.sources) {
        try {
            const sourceFolderPath = pathOf(project.collectionsPath, source.path)

            const token = source.authType
                ? await getSourceToken(source.url) ?? undefined
                : undefined

            if (source.authType && !token) {
                authErrors.push({ source, error: 'required auth token is not set' })
                continue
            }

            const remoteDoc = await fetchOpenApiSpec(source.url, token)

            if (remoteDoc.isErr) {
                authErrors.push({
                    source: source,
                    error: remoteDoc.error.message
                })
                continue
            }

            const doc = remoteDoc.value

            const remoteMap = flattenImportedFolder(convertDocumentToFolder(doc), sourceFolderPath)
            const diskMap = await readDiskFileMap(sourceFolderPath, fileStorage)

            const changes = diffMaps(remoteMap, diskMap)

            if (changes.length > 0) {
                results.push({ source, changes, remoteDoc: doc })
            }
        } catch (e) {
            console.error(`[sources] Failed to check source "${source.url}":`, e)
        }
    }

    return {
        changes: results,
        authErrors
    }
}

export function diffSources(documentA: OpenAPIV3.Document, documentB: OpenAPIV3.Document, sourceFolderPath = ''): SourceChange[] {
    try {
        const localFlat = flattenImportedFolder(convertDocumentToFolder(documentA), sourceFolderPath)
        const localMap = new Map<string, string>([...localFlat].map(([p, e]) => [p, e.content]))
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

type FlattenedEntry = { content: string; spec?: RequestSpec }

/** Flatten an ImportedFolder into a map of path → { content, spec }.
 *  The root folder is not included as a prefix — its items are the root level. */
function flattenImportedFolder(folder: ImportedFolder, prefix = ''): Map<string, FlattenedEntry> {
    const map = new Map<string, FlattenedEntry>()
    for (const item of folder.items) {
        if ('request' in item) {
            const req = item as ImportedRequest
            const filename = sanitizeFilename(req.name) + FileType.HTTP
            map.set(pathOf(prefix, filename), { content: req.request, spec: req.spec })
        } else {
            const sub = item as ImportedFolder
            const subPrefix = pathOf(prefix, sanitizeFilename(sub.name))
            for (const [p, e] of flattenImportedFolder(sub, subPrefix)) {
                map.set(p, e)
            }
        }
    }
    return map
}

function diffMaps(remote: Map<string, FlattenedEntry>, local: Map<string, string>): SourceChange[] {
    const changes: SourceChange[] = []

    for (const [path, { content: newContent, spec }] of remote) {
        if (!local.has(path)) {
            changes.push({ kind: 'added', path, newContent, spec })
        } else {
            const merged = mergeRequestContent(local.get(path) ?? '', newContent ?? '')
            if (local.get(path) !== merged) {
                changes.push({ kind: 'modified', path, oldContent: local.get(path), newContent: merged, spec })
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
