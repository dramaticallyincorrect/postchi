import DefaultFileStorage from '@/lib/storage/files/file-default'
import { Project } from '../project/project'
import { PendingSourceChanges, SOURCE_SPEC_FILENAME } from './source-checker'
import { pathOf } from '@/lib/storage/files/join'

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
                    break
                }
                case 'removed': {
                    await fileStorage.delete(change.path)
                    break
                }
                case 'modified': {
                    await fileStorage.writeText(change.path, change.newContent ?? '')
                    break
                }
            }
        }

        const specPath = pathOf(project.collectionsPath, source.path, SOURCE_SPEC_FILENAME)
        await fileStorage.writeText(specPath, JSON.stringify(remoteDoc, null, 2))
    }
}
