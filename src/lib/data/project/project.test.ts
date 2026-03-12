import { fs } from "memfs";
import { describe, expect, it } from "vitest";
import { FileType } from "../supported-filetypes";
import { createHttpRequest, createProjectFolder } from "./project";
import { pathOf } from "../files/join";


const root = '/test'
fs.mkdirSync(root)

describe('project file creation', () => {

    it('creates folder', async () => {
        await createProjectFolder(root);
        const stats = fs.statSync(root);
        expect(stats.isDirectory()).toBe(true);
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