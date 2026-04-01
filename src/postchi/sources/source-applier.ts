import DefaultFileStorage from '@/lib/storage/files/file-default'
import { patchFolderSettings, Project } from '../project/project'
import { PendingSourceChanges, SOURCE_SPEC_FILENAME } from './source-checker'
import * as yaml from 'js-yaml'
import { pathOf } from '@/lib/storage/files/join'
import { extractGlobalSecurity } from '../import/open-api/open-api-parser'
import { REQUEST_SPEC_FILENAME_SUFFIX } from './request-spec'
import { FileType } from '../project/file-types/supported-filetypes'

export async function applySourceChanges(
    pending: PendingSourceChanges[],
    project: Project,
    fileStorage = DefaultFileStorage.getInstance()
): Promise<void> {
    for (const { source, changes, remoteDoc } of pending) {
        for (const change of changes) {
            switch (change.kind) {
                case 'added': {
                    const parentDir = change.path.substring(0, change.path.lastIndexOf('/'))
                    await fileStorage.mkdir(parentDir)
                    await fileStorage.create(change.path, change.newContent ?? '')
                    if (change.spec) {
                        const specFilePath = change.path.replace(new RegExp(`\\${FileType.HTTP}$`), REQUEST_SPEC_FILENAME_SUFFIX)
                        await fileStorage.create(specFilePath, yaml.dump(change.spec))
                    }
                    break
                }
                case 'removed': {
                    await fileStorage.delete(change.path)
                    const specFilePath = change.path.replace(new RegExp(`\\${FileType.HTTP}$`), REQUEST_SPEC_FILENAME_SUFFIX)
                    try { await fileStorage.delete(specFilePath) } catch { /* spec file may not exist */ }
                    break
                }
                case 'modified': {
                    await fileStorage.writeText(change.path, change.newContent ?? '')
                    if (change.spec) {
                        const specFilePath = change.path.replace(new RegExp(`\\${FileType.HTTP}$`), REQUEST_SPEC_FILENAME_SUFFIX)
                        await fileStorage.writeText(specFilePath, yaml.dump(change.spec))
                    }
                    break
                }
            }
        }

        const specPath = pathOf(project.collectionsPath, source.path, SOURCE_SPEC_FILENAME)
        await fileStorage.writeText(specPath, yaml.dump(remoteDoc))

        const security = extractGlobalSecurity(remoteDoc)
        if (security) {
            await patchFolderSettings(pathOf(project.collectionsPath, source.path), { security }, fileStorage)
        }
    }
}
