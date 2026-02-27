import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { collectionsDirName, envExtension, environmentsName, FileItem, FileTreeItem, FolderItem, readFileTree, secretsName } from "./project-files";
import { fs } from 'memfs';
import { join } from 'path';
import { BrowserFileStorage } from "./files/file-browser";

const rootPath = join('postchi-test-project',)

beforeAll(async () => {
    fs.mkdirSync(rootPath, { recursive: true });
    fs.mkdirSync(join(rootPath, collectionsDirName));
    fs.writeFileSync(join(rootPath, `.DS_Store`), '');
    fs.writeFileSync(join(rootPath, `${environmentsName}${envExtension}`), '');
    fs.writeFileSync(join(rootPath, `${secretsName}${envExtension}`), '');
})

afterAll(async () => {
    fs.rmSync(rootPath, { recursive: true, force: true });
})


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


    const items = await readFileTree(rootPath, new BrowserFileStorage())


    expect(items).toStrictEqual(expected)

})





test("parses file tree from indented text", () => {
    const input = `
collections
    assets
        logo.get
    login.get
    users.get
environments.cenv
secrets.cenv
`

    const expected = [
        {
            name: collectionsDirName, path: join(rootPath, collectionsDirName), items: [
                {
                    name: 'assets', path: join(rootPath, collectionsDirName, 'assets'), items: [
                        { name: 'logo.get', path: join(rootPath, collectionsDirName, 'assets', 'logo.get') },
                    ]
                },
                { name: 'login.get', path: join(rootPath, collectionsDirName, 'login.get') },
                { name: 'users.get', path: join(rootPath, collectionsDirName, 'users.get') },
            ]
        },
        { name: `${environmentsName}${envExtension}`, path: join(rootPath, `${environmentsName}${envExtension}`) },
        { name: `${secretsName}${envExtension}`, path: join(rootPath, `${secretsName}${envExtension}`) }
    ]


    expect(parseFileTree(input, rootPath)).toStrictEqual(expected)

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
                result.push({ name: item.name, path: item.name, items: children } as FolderItem)
                i = nextIndex
            } else {
                result.push({ name: item.name, path: item.name } as FileItem)
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