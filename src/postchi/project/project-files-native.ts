import { invoke } from '@tauri-apps/api/core'
import { FileItem, FileTreeItem, FolderItem } from './project-files'
import { Project } from './project'

type RawFile = {
    type: 'File'
    name: string
    path: string
    before: string
    after: string
    traits: Array<'executable' | 'pinable'>
}

type RawFolder = {
    type: 'Folder'
    name: string
    path: string
    items: RawItem[]
    isSource: boolean
}

type RawItem = RawFile | RawFolder

function hydrate(raw: RawItem[]): FileTreeItem[] {
    return raw.map(item =>
        item.type === 'Folder'
            ? new FolderItem(item.name, item.path, hydrate(item.items), item.isSource)
            : new FileItem(item.name, item.path, item.before, item.after, item.traits)
    )
}

export async function readProjectFileTreeNative(project: Project): Promise<FileTreeItem[]> {
    const raw = await invoke<RawItem[]>('read_project_file_tree', {
        paths: {
            projectPath: project.path,
            collectionsPath: project.collectionsPath,
            actionsPath: project.actionsPath,
            envPath: project.envPath,
            secretsPath: project.secretsPath,
        }
    })
    return hydrate(raw)
}
