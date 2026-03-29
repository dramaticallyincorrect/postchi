import { FileStorage } from '../files/file'
import DefaultFileStorage from '../files/file-default'
import { pathOf } from '../files/join'
import { Project } from '../project/project'
import { PendingSourceChanges, SOURCE_SPEC_FILENAME } from './source-checker'
import { mergeRequestContent } from './source-merger'

export async function applySourceChanges(
    pending: PendingSourceChanges[],
    project: Project,
    fileStorage: FileStorage = DefaultFileStorage.getInstance()
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
                    const merged = mergeRequestContent(change.oldContent ?? '', change.newContent ?? '')
                    await fileStorage.writeText(change.path, merged)
                    break
                }
            }
        }

        const specPath = pathOf(project.collectionsPath, source.path, SOURCE_SPEC_FILENAME)
        await fileStorage.writeText(specPath, JSON.stringify(remoteDoc, null, 2))
    }
}
