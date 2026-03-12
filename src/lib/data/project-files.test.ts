import { expect, test } from "vitest";
import { fs } from 'memfs';
import { join } from 'path';
import { BrowserFileStorage } from "./files/file-browser";
import { FileTreeItem, isPathInFileTree, readFileTree } from "./project-files";
import { parseFileTree } from "../utils/test-utils";

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