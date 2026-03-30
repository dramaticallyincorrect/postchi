import { fs } from "memfs"
import { pathOf } from "../storage/files/join"
import { FileItem, FileTreeItem, FolderItem } from "../../postchi/project/project-files"
import { filenameWithoutExtension } from "../storage/files/file-utils/file-utils"

export const whitespaces = [' ', '  ', '   ', '\t', ' \t\t']
export const newlines = ['\n', '\n\n', '\n\n\n']

export function endOf(str: string, search: string): number {
    return str.indexOf(search) + search.length
}

/*
Parses a string representation of a file tree into an array of FileTreeItem objects.
The input string should use indentation (4 spaces) to represent folder hierarchy, and each line represents a file or folder name.
Example input:
collections
    assets
        logo.get
    login.get
    users.get
environments.cenv
secrets.cenv

This would represent a file tree with a "collections" folder containing an "assets" subfolder (which contains "logo.get"), and two files "login.get" and "users.get". Additionally, there are two files at the root level: "environments.cenv" and "secrets.cenv".
*/
export function parseFileTree(input: string, basePath: string): FileTreeItem[] {
    const lines = input.split('\n').filter(line => line.trim())

    const parsed = lines.map(line => {
        const name = line.trim()
        const indent = line.match(/^(\s*)/)?.[1].length ?? 0
        const level = Math.round(indent / 4)
        return { name, level }
    })

    function buildTree(items: typeof parsed, startIndex: number, currentLevel: number): [FileTreeItem[], number] {
        const result: FileTreeItem[] = []
        let i = startIndex

        while (i < items.length) {
            const item = items[i]

            if (item.level < currentLevel) break

            const isFolder = i + 1 < items.length && items[i + 1].level > item.level

            if (isFolder) {
                const [children, nextIndex] = buildTree(items, i + 1, currentLevel + 1)
                result.push(new FolderItem(item.name, item.name, children))
                i = nextIndex
            } else {
                result.push(new FileItem(item.name, item.name))
                i++
            }
        }

        return [result, i]
    }

    const [tree] = buildTree(parsed, 0, 0)

    function fixPaths(items: FileTreeItem[], parentPath: string): void {
        for (const item of items) {
            const fullPath = pathOf(parentPath, item.name)
            item.path = fullPath
            item.name = filenameWithoutExtension(item.name)
            if ('items' in item) fixPaths(item.items, fullPath)
        }
    }

    fixPaths(tree, basePath)
    return tree
}

export function createFileTree(items: FileTreeItem[]): void {
    for (const item of items) {
        if ('items' in item) {
            fs.mkdirSync(item.path, { recursive: true })
            createFileTree(item.items)
        } else {
            fs.writeFileSync(item.path, '')
        }
    }
}