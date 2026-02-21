
import { TauriFileStorage } from './files/file-tauri';

export type FileItem = { name: string, path: string }
export type FolderItem = { name: string; path: string, items: FileTreeItem[] }
export type FileTreeItem = FileItem | FolderItem

export const collectionsDirName = "collections"
export const environmentsName = "environments"
export const secretsName = "secrets"
export const envExtension = '.cenv'

export async function readFileTree(root: string, storage: FileStorage = new TauriFileStorage()): Promise<FileTreeItem[]> {

    const items = await readItems(root, storage)
    return items
}

async function readItems(path: string, storage: FileStorage = new TauriFileStorage()): Promise<FileTreeItem[]> {
    return storage.readDirectory(path).then(entries => {
        return Promise.all(
            entries.filter(entry => !entry.filename.startsWith('.'))
                .sort((a, b) => a.filename.localeCompare(b.filename))
                .map(async entry => {
                    if (entry.isDirectory) {
                        return { name: entry.filename, path: entry.path, items: await readItems(entry.path, storage) }
                    }

                    return { name: entry.filename, path: entry.path }
                }))
    })
}