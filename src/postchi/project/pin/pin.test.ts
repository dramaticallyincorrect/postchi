import { beforeEach, describe, expect, it } from "vitest";
import { fs } from 'memfs';
import { createProject, pinnedPathForProject } from "../project";
import { addToPinned, removePinned } from "./pin";

describe('pin', () => {

    const root = '/tmp/project'


    beforeEach(async () => {
        await createProject(root)
    })

    const fullTestPath = '/tmp/project/collections/request.chttp'
    const testPinnedPath = 'collections/request.chttp'

    it('adds pin', async () => {
        await addToPinned(fullTestPath, root)
        expect(fs.readFileSync(pinnedPathForProject(root), 'utf-8').toString()).toBe(testPinnedPath + '\n')
    })

    it('removes pin', async () => {
        await addToPinned(fullTestPath, root)
        await addToPinned(fullTestPath + '2', root)
        await removePinned(testPinnedPath, root)
        expect(fs.readFileSync(pinnedPathForProject(root), 'utf-8').toString()).toBe(testPinnedPath + '2' + '\n')
    })

})


