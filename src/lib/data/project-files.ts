
import { FileStorage } from './files/file';
import DefaultFileStorage from './files/file-default';

export class FileItem {
    name: string;
    path: string;

    constructor(name: string, path: string) {
        this.name = name;
        this.path = path;
    }
}

export class FolderItem {
    name: string;
    path: string;
    items: FileTreeItem[]

    constructor(name: string, path: string, items: FileTreeItem[]) {
        this.name = name;
        this.path = path;
        this.items = items;
    }
}

export type FileTreeItem = FileItem | FolderItem

export async function readFileTree(root: string, storage: FileStorage = DefaultFileStorage.getInstance()): Promise<FileTreeItem[]> {
    const items = await readItems(root, storage)
    return items
}

async function readItems(path: string, storage: FileStorage = DefaultFileStorage.getInstance()): Promise<FileTreeItem[]> {
    return storage.readDirectory(path).then(entries => {
        return Promise.all(
            entries.filter(entry => !entry.filename.startsWith('.'))
                .sort((a, b) => a.filename.localeCompare(b.filename))
                .map(async entry => {
                    if (entry.isDirectory) {
                        return new FolderItem(entry.filename, entry.path, await readItems(entry.path, storage))
                    }

                    return new FileItem(entry.filename, entry.path)
                }))
    })
}


export function isPathInFileTree(fileTree: FileTreeItem[], path: string): boolean {
    for (const item of fileTree) {
        if (item.path === path) {
            return true;
        }

        if (item instanceof FolderItem) {
            if (isPathInFileTree(item.items, path)) {
                return true;
            }
        }
    }

    return false;
}