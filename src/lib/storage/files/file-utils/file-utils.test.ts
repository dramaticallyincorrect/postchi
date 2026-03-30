import { createFileTree, parseFileTree } from "@/lib/utils/test-utils";
import { fs } from "memfs";
import { beforeEach, describe, expect, it } from "vitest";
import { readClosestFile } from "./file-utils";

describe('closes file to path', async () => {

    const filePath = '/test-project/collections/assets/nested/deep/request.get'
    const expected = '/test-project/collections/assets/settings'

    it('reads the closest file', async () => {
        const settings = await readClosestFile('settings', filePath)
        expect(settings.isOk).toBe(true)
        expect(settings.unwrapOr(null)).toBe('settings content')
    })

    it('file in the same directory is considered closest', async () => {
        fs.mkdirSync('/test')

        fs.writeFileSync('/test/request.get', 'file content')
        fs.writeFileSync('/test/settings.json', 'settings content')

        const settings = await readClosestFile('settings.json', '/test/request.get')
        expect(settings.unwrapOr(null)).toBe('settings content')
    })

    it('returns null when no file is found', async () => {
        const settings = await readClosestFile('nonexistent', filePath)
        expect(settings.isErr).toBe(true)
        expect(settings.unwrapOr(null)).toBe(null)
    })


    beforeEach(() => {
        fs.rmSync('/test-project', { recursive: true, force: true })
        const files = `
collections
    assets
        settings
        nested
            deep
                request.get
        logo.get
    login.get
    users.get
environments.cenv
secrets.cenv
`

        const tree = parseFileTree(files, '/test-project')
        createFileTree(tree)


        fs.writeFileSync(filePath, 'file content')

        fs.writeFileSync(expected, 'settings content')
    })



})