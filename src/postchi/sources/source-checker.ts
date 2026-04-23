import { fetchOpenApiSpec, convertDocumentToFolder, fetchOpenApiSpecFromText } from "../import/open-api/open-api-parser"
import { ImportedFolder, ImportedRequest } from "../import/postman/postman-parser"
import { sanitizeFilename } from "../project/project"
import { Source, readSources } from "./sources"
import { Project } from "../project/project"
import { OpenAPIV3 } from "openapi-types"
import { mergeRequestContent } from "./source-merger"
import DefaultFileStorage from "@/lib/storage/files/file-default"
import { pathOf } from "@/lib/storage/files/join"
import { getSourceToken } from "@/lib/storage/store/credential-store"
import { FileType } from "../project/file-types/supported-filetypes"
import { RequestSpec } from "./request-spec"
import { getActiveProject } from "@/lib/project-state"
import { fromPromise } from "true-myth/task"
import { FileStorage } from "@/lib/storage/files/file"
import * as yaml from 'js-yaml'

export const SOURCE_SPEC_FILENAME = 'source.yaml'

export type ChangeKind = 'added' | 'removed' | 'modified' | 'spec' | 'source'

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

            console.log('source path is ', pathOf(sourceFolderPath, SOURCE_SPEC_FILENAME))
            const localDoc = await DefaultFileStorage.getInstance().readText(pathOf(sourceFolderPath, SOURCE_SPEC_FILENAME)).then((text) => fetchOpenApiSpecFromText(text))

            const changes = await diffSources(localDoc, doc, sourceFolderPath)

            if (changes.length > 0) {
                results.push({ source, changes, remoteDoc: doc })
            }
        } catch (e) {
            console.error(`[sources] Failed to check source "${source.url}":`)
        }
    }

    return {
        changes: results,
        authErrors
    }
}

export async function diffSources(local: OpenAPIV3.Document, remote: OpenAPIV3.Document, sourceFolderPath = '', fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<SourceChange[]> {
    try {
        const localFlat = flattenImportedFolder(convertDocumentToFolder(local, true), sourceFolderPath)
        const remoteMap = flattenImportedFolder(convertDocumentToFolder(remote, true), sourceFolderPath)
        const diffs = await diffMaps(localFlat, remoteMap, fileStorage)
        console.log('source changed', yaml.dump(local) != yaml.dump(remote))
        if (diffs.length == 0 && yaml.dump(local) != yaml.dump(remote)) {
            console.log('source change')
            diffs.push({
                kind: 'source',
                path: pathOf(sourceFolderPath, SOURCE_SPEC_FILENAME),
                oldContent: yaml.dump(local),
                newContent: yaml.dump(remote)
            })
        }
        return diffs
    } catch (e) {
        console.error(`[sources] Failed to diff sources:`, e)
        return []
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

async function diffMaps(local: Map<string, FlattenedEntry>, remote: Map<string, FlattenedEntry>, fileStorage = DefaultFileStorage.getInstance()): Promise<SourceChange[]> {
    const changes: SourceChange[] = []

    for (const [path, { content: newContent, spec }] of remote) {
        if (!local.has(path)) {
            changes.push({ kind: 'added', path, newContent, spec })
        } else {
            if (local.get(path)?.content !== newContent || !(await fileStorage.exists(path))) {
                const onDiskResult = await fromPromise(DefaultFileStorage.getInstance().readText(path))
                const merged = mergeRequestContent(onDiskResult.unwrapOr(local.get(path)?.content) ?? '', newContent ?? '')
                changes.push({ kind: 'modified', path, oldContent: local.get(path)?.content, newContent: merged, spec })
            } else if (yaml.dump(local.get(path)?.spec) != yaml.dump(spec)) {
                changes.push({ kind: 'spec', path, spec: spec, oldContent: yaml.dump(local.get(path)?.spec), newContent: yaml.dump(spec) })
            }
        }
    }

    for (const [path, { content: oldContent }] of local) {
        if (!remote.has(path)) {
            changes.push({ kind: 'removed', path, oldContent })
        }
    }

    return changes
}
