import { fs } from "memfs";
import { beforeEach, describe, expect, it } from "vitest";
import { FileType } from "../supported-filetypes";
import { createOrOverrideFolderSettings, createHttpRequest, createProjectFolder, readFolderSettings, readSettingsForRequest } from "./project";
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

    describe('settings', () => {
        it('creates when none exists', async () => {
            await createOrOverrideFolderSettings(root);
            const stats = fs.statSync(pathOf(root, 'settings.json'));
            expect(stats.isFile()).toBe(true);
        })

        it('overrides when already exists', async () => {
            fs.writeFileSync(pathOf(root, 'settings.json'), JSON.stringify({ baseUrl: 'https://getpostchi.org' }))
            await createOrOverrideFolderSettings(root, { baseUrl: 'https://new-url.com' })
            const content = fs.readFileSync(pathOf(root, 'settings.json'), 'utf-8')
            expect(content).toBe(JSON.stringify({ baseUrl: 'https://new-url.com' }))
        })
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

    describe('closest settings', () => {
        it('returns FolderSettings when exists', async () => {


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

        it('returns empty FolderSettings when none exists', async () => {


            const expected = {
                baseUrl: ''
            }
            const tree = parseFileTree(`    
nested
    test.get
`, root)
            createFileTree(tree)

            const requestPath = pathOf(root, 'nested', 'test.get')

            const settings = await readSettingsForRequest(requestPath)

            expect(settings).toEqual(expected)

        })

    })

    describe('read folder settings', () => {
        it('returns FolderSettings when exists', () => {
            fs.writeFileSync(pathOf(root, 'settings.json'), JSON.stringify({ baseUrl: 'https://getpostchi.org' }))
            const settings = readFolderSettings(root)
            expect(settings).resolves.toEqual({ baseUrl: 'https://getpostchi.org' })
        })

        it('throws when none exists', () => {
            const settings = readFolderSettings(root)
            expect(settings).rejects.toBeDefined()
        })
    })
})