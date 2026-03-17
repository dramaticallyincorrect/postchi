
import { FileStorage } from './files/file';
import DefaultFileStorage from './files/file-default';
import { Project } from './project/project';

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

export async function readProjectFileTree(project: Project, storage: FileStorage = DefaultFileStorage.getInstance()): Promise<FileTreeItem[]> {
    const colllectionItems = await readItems(project.collectionsPath, storage)
    return [
        new FolderItem('collections', project.collectionsPath, colllectionItems),
        new FileItem('environments.cenv', project.envPath),
        new FileItem('secrets.cenv', project.secretsPath)
    ]
}

async function readItems(path: string, storage: FileStorage = DefaultFileStorage.getInstance()): Promise<FileTreeItem[]> {
    return storage.readDirectory(path).then(entries => {
        const filtered = entries.filter(entry => !entry.filename.startsWith('.') && entry.filename !== 'settings.json')
        const files = filtered.filter(e => !e.isDirectory).sort((a, b) => a.filename.localeCompare(b.filename))
        const folders = filtered.filter(e => e.isDirectory).sort((a, b) => a.filename.localeCompare(b.filename))

        return Promise.all([
            ...files.map(entry => Promise.resolve(new FileItem(entry.filename, entry.path))),
            ...folders.map(async entry => new FolderItem(entry.filename, entry.path, await readItems(entry.path, storage)))
        ])
    })
}


export function collectHttpFiles(items: FileTreeItem[]): FileItem[] {
    return items.flatMap(item =>
        item instanceof FolderItem
            ? collectHttpFiles(item.items)
            : item.path.endsWith('.get') ? [item] : []
    )
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