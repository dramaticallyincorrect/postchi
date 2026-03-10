import { expect, test } from "vitest";
import { fs } from 'memfs';
import { join } from 'path';
import { BrowserFileStorage } from "./files/file-browser";
import { FileItem, FileTreeItem, FolderItem, isPathInFileTree, readFileTree } from "./project-files";

const rootPath = '/test-project'

test("reads all files in the project directory sorted by name ignoring hiddens", async () => {
    const files = `
collections
    assets
        logo.get
    login.get
    users.get
environments.cenv
secrets.cenv
`
    const expected = parseFileTree(files, rootPath)

    createFileTree(expected)
    fs.writeFileSync(join(rootPath, '.hiddenfile'), '')

    const items = await readFileTree(rootPath, new BrowserFileStorage())


    expect(items).toStrictEqual(expected)

})

test("should return false when file is not in list", async () => {
    const files = `
collections
    assets
        logo.get
    login.get
    users.get
environments.cenv
secrets.cenv
`
    const initial = parseFileTree(files, rootPath)

    expect(isPathInFileTree(initial, join(rootPath, 'collections', 'assets', 'logo.get'))).toBe(true)
    expect(isPathInFileTree(initial, join(rootPath, 'collections', 'assets', 'missing.get'))).toBe(false)

})




function parseFileTree(input: string, basePath: string): FileTreeItem[] {
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

            const isFolder = i + 1 < items.length && items[i + 1].level > currentLevel

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
            const fullPath = join(parentPath, item.name)
            item.path = fullPath
            if ('items' in item) fixPaths(item.items, fullPath)
        }
    }

    fixPaths(tree, basePath)
    return tree
}

function createFileTree(items: FileTreeItem[]): void {
    for (const item of items) {
        if ('items' in item) {
            fs.mkdirSync(item.path, { recursive: true })
            createFileTree(item.items)
        } else {
            fs.writeFileSync(item.path, '')
        }
    }
}