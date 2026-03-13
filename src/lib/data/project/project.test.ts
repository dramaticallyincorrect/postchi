import { fs } from "memfs";
import { beforeEach, describe, expect, it } from "vitest";
import { FileType } from "../supported-filetypes";
import { createFolderSettings, createHttpRequest, createProjectFolder, readSettingsForRequest } from "./project";
import { pathOf } from "../files/join";
import { createFileTree, parseFileTree } from "@/lib/utils/test-utils";


const root = '/test'
fs.mkdirSync(root)

beforeEach(() => {
    fs.rmdirSync(root, { recursive: true })
    fs.mkdirSync(root)
})

describe('project file creation', () => {

    it('creates folder', async () => {
        await createProjectFolder(root);
        const stats = fs.statSync(root);
        expect(stats.isDirectory()).toBe(true);
    })

    it('settings file', async () => {
        await createFolderSettings(root);
        const stats = fs.statSync(pathOf(root, 'settings.json'));
        expect(stats.isFile()).toBe(true);
    })

    describe('http requests', () => {
        it('adds extension when name does not have extension', async () => {
            const path = await createHttpRequest(root, 'my-request',)
            expect(path).toBe(pathOf(root, `my-request${FileType.HTTP}`))
            expect(fs.existsSync(path)).toBe(true)
        })

        it('does not duplicate extension when name already has extension', async () => {
            const path = await createHttpRequest(root, `my-request${FileType.HTTP}`,)
            expect(path).toBe(pathOf(root, `my-request${FileType.HTTP}`))
            expect(fs.existsSync(path)).toBe(true)
        })
    })
})

describe('read project files', () => {

    it('settings.json', async () => {


        const expected = {
            baseUrl: 'https://getpostchi.org'
        }
        const tree = parseFileTree(`    
settings.json
nested
    test.get
`, root)
        createFileTree(tree)

        fs.writeFileSync(pathOf(root, 'settings.json'), JSON.stringify(expected))


        const requestPath = pathOf(root, 'nested', 'test.get')

        const settings = await readSettingsForRequest(requestPath)

        expect(settings).toEqual(expected)



    })
})