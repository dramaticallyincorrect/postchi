
import { FileStorage } from './files/file';
import DefaultFileStorage from './files/file-default';
import { afterScriptPath } from './http/after-script-executor';
import { Project } from './project/project';
import { beforeScriptPath } from './http/before-script-executor';
import { FileType } from './supported-filetypes';
import { trimExtension } from './files/file-utils/file-utils';
import { readSources } from './sources/sources';
import { pathOf } from './files/join';

export class FileItem {
    name: string;
    path: string;
    before: string = '';
    after: string = '';

    constructor(name: string, path: string, before: string = '', after: string = '') {
        this.name = name;
        this.path = path;
        this.before = before;
        this.after = after;
    }
}

export class FolderItem {
    name: string;
    path: string;
    items: FileTreeItem[]
    isSource: boolean;

    constructor(name: string, path: string, items: FileTreeItem[], isSource: boolean = false) {
        this.name = name;
        this.path = path;
        this.items = items;
        this.isSource = isSource;
    }
}

export type FileTreeItem = FileItem | FolderItem

export async function readProjectFileTree(project: Project, storage: FileStorage = DefaultFileStorage.getInstance()): Promise<FileTreeItem[]> {
    const [colllectionItems, actionsItems, sourcesConfig] = await Promise.all([
        readItems(project.collectionsPath, storage),
        readActionItems(project.actionsPath, storage),
        readSources(project.path, storage).catch(() => ({ sources: [] })),
    ])
    const sourcePaths = new Set(sourcesConfig.sources.map(s => pathOf(project.collectionsPath, s.path)))
    markSourceFolders(colllectionItems, sourcePaths)
    const result: FileTreeItem[] = [
        new FolderItem('collections', project.collectionsPath, colllectionItems),
    ]
    if (actionsItems.length > 0) {
        result.push(new FolderItem('actions', project.actionsPath, actionsItems))
    }
    result.push(
        new FileItem('environments', project.envPath),
        new FileItem('secrets', project.secretsPath)
    )
    return result
}

function markSourceFolders(items: FileTreeItem[], sourcePaths: Set<string>): void {
    for (const item of items) {
        if (item instanceof FolderItem) {
            item.isSource = sourcePaths.has(item.path)
            markSourceFolders(item.items, sourcePaths)
        }
    }
}

async function readItems(path: string, storage: FileStorage = DefaultFileStorage.getInstance()): Promise<FileTreeItem[]> {
    return storage.readDirectory(path).then(entries => {
        const filtered = entries.filter(entry => !entry.filename.startsWith('.') && entry.filename !== 'settings.json' && !entry.filename.endsWith('.after.js') && !entry.filename.endsWith('.before.js'))
        const files = filtered.filter(e => !e.isDirectory).sort((a, b) => a.filename.localeCompare(b.filename))
        const folders = filtered.filter(e => e.isDirectory).sort((a, b) => a.filename.localeCompare(b.filename))

        return Promise.all([
            ...files.map(async entry => {
                const fileItem = new FileItem(trimExtension(entry.filename), entry.path)

                // Load before script if it exists
                const lastDot = entry.path.lastIndexOf('.');
                const base = lastDot !== -1 ? entry.path.substring(0, lastDot) : entry.path;
                if (await storage.exists(beforeScriptPath(base))) {
                    fileItem.before = beforeScriptPath(base);
                }
                if (await storage.exists(afterScriptPath(base))) {
                    fileItem.after = afterScriptPath(base);
                }

                return fileItem
            }),
            ...folders.map(async entry => new FolderItem(entry.filename, entry.path, await readItems(entry.path, storage)))
        ])
    })
}

export async function readActionItems(path: string, storage: FileStorage = DefaultFileStorage.getInstance()): Promise<FileItem[]> {
    try {
        const entries = await storage.readDirectory(path)
        return entries
            .filter(e => !e.isDirectory && e.filename.endsWith(FileType.QUICK_ACTION))
            .sort((a, b) => a.filename.localeCompare(b.filename))
            .map(e => new FileItem(e.filename.slice(0, -FileType.QUICK_ACTION.length), e.path))
    } catch {
        return []
    }
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