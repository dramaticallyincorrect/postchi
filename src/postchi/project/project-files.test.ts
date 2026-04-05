import { expect, test } from "vitest";
import { fs } from 'memfs';
import { join } from 'path';
import { createFileTree, parseFileTree } from "../../lib/utils/test-utils";
import { createProject } from "./project";
import { isPathInFileTree, readProjectFileTree } from "./project-files";
import { addSource } from "../sources/sources";

const rootPath = '/test-project'

test("reads all files in the project directory sorted by name ignoring hiddens", async () => {
    const files = `
collections
    assets
        logo.get
environments.cenv
secrets.cenv
`
    const expected = parseFileTree(files, rootPath)

    createFileTree(expected)
    fs.writeFileSync(join(rootPath, '.hiddenfile'), '')
    const project = await createProject(rootPath)
    const items = await readProjectFileTree(project)


    expect(items).toStrictEqual(expected)

})

test("filters out settings.json files from project file tree", async () => {
    const files = `
collections
    assets
        logo.get
environments.cenv
secrets.cenv
`
    const expected = parseFileTree(files, rootPath)

    createFileTree(expected)
    fs.writeFileSync(join(rootPath, 'settings.json'), '{}')
    const project = await createProject(rootPath)
    const items = await readProjectFileTree(project)


    expect(items).toStrictEqual(expected)

})


test("excludes source files from project file tree", async () => {

    const project = await createProject(rootPath)
    await addSource(project.path, {
        path: 'assets',
        url: 'http://example.com/collections/assets',
        type: 'open-api',
    })

    const files = `
collections
    assets
        logo.get
environments.cenv
secrets.cenv
`
    const expected = parseFileTree(files, rootPath)

    createFileTree(expected)
    fs.mkdirSync(join(rootPath, 'collections', 'assets'), { recursive: true })
    fs.writeFileSync(join(rootPath, 'collections', 'assets', 'source.yaml'), '- yaml')

    const items = await readProjectFileTree(project)



    expect(isPathInFileTree(items, join(rootPath, 'collections', 'assets', 'source.yaml'))).toEqual(false)

})


test("groups items, files first then folders", async () => {
    const files = `
collections
    login.get
    users.get
    assets
        logo.get
environments.cenv
secrets.cenv
`
    const expected = parseFileTree(files, rootPath)

    createFileTree(expected)

    const project = await createProject(rootPath)
    const items = await readProjectFileTree(project)


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