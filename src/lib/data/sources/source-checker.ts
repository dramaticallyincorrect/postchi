import { fetchOpenApiSpec, convertDocumentToFolder } from "../import/open-api/open-api-parser"
import { ImportedFolder, ImportedRequest } from "../import/postman/postman-parser"
import { FileStorage } from "../files/file"
import DefaultFileStorage from "../files/file-default"
import { pathOf } from "../files/join"
import { sanitizeFilename } from "../project/project"
import { FileType } from "../supported-filetypes"
import { Source, readSources } from "./sources"
import { Project } from "../project/project"
import { OpenAPIV3 } from "openapi-types"

export const SOURCE_SPEC_FILENAME = 'source.json'

export type ChangeKind = 'added' | 'removed' | 'modified'

export type SourceChange = {
    kind: ChangeKind
    /** Path of the derived request file relative to the source's root folder */
    path: string
    oldContent?: string
    newContent?: string
}

export type PendingSourceChanges = {
    source: Source
    changes: SourceChange[]
}

export async function checkSources(
    project: Project,
    fileStorage: FileStorage = DefaultFileStorage.getInstance()
): Promise<PendingSourceChanges[]> {
    const config = await readSources(project.path, fileStorage)
    const results: PendingSourceChanges[] = []

    for (const source of config.sources) {
        try {
            const sourceFolderPath = pathOf(project.collectionsPath, source.path)
            const localDoc = await readLocalSpec(sourceFolderPath, fileStorage)
            if (!localDoc) continue

            const remoteDoc = await fetchOpenApiSpec(source.url)

            const changes = diffSources(localDoc, remoteDoc, sourceFolderPath)
            if (changes.length > 0) {
                results.push({ source, changes })
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
        const changes = diffMaps(remoteMap, localMap,)
        return changes
    } catch (e) {
        console.error(`[sources] Failed to check source:`, e)
        return []
    }
}

async function readLocalSpec(
    sourceFolderPath: string,
    fileStorage = DefaultFileStorage.getInstance()
): Promise<OpenAPIV3.Document | null> {
    const specPath = pathOf(sourceFolderPath, SOURCE_SPEC_FILENAME)
    try {
        const text = await fileStorage.readText(specPath)
        return JSON.parse(text) as OpenAPIV3.Document
    } catch {
        return null
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
        } else if (local.get(path) !== newContent) {
            changes.push({ kind: 'modified', path, oldContent: local.get(path), newContent })
        }
    }

    for (const [path, oldContent] of local) {
        if (!remote.has(path)) {
            changes.push({ kind: 'removed', path, oldContent })
        }
    }

    return changes
}
