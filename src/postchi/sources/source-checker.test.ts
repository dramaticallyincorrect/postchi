import { describe, expect, it } from "vitest";
import { diffSources } from "./source-checker";
import { OpenAPIV3 } from "openapi-types";
import DefaultFileStorage from "@/lib/storage/files/file-default";
import { pathOf } from "@/lib/storage/files/join";

function makeDoc(paths: OpenAPIV3.PathsObject): OpenAPIV3.Document {
    return {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths
    }
}

const ok200: OpenAPIV3.ResponsesObject = { '200': { description: 'OK' } }

const petsGet: OpenAPIV3.PathItemObject = {
    get: { summary: 'List Pets', responses: ok200 }
}

const param = (name: string, example?: string): OpenAPIV3.ParameterObject => ({
    name, in: 'query', schema: { type: 'string', example }
})

const sourceDiskPath = '/tmp/Test API/'

const fs = DefaultFileStorage.getInstance()

describe('diffSources', () => {
    fs.mkdir(sourceDiskPath)
    it('add', async () => {
        const local = makeDoc({ '/pets': petsGet })
        const remote = makeDoc({
            '/pets': petsGet,
            '/users': { get: { summary: 'List Users', responses: ok200 } }
        })

        const changes = await diffSources(local, remote)

        expect(changes).toHaveLength(1)
        expect(changes[0].kind).toBe('added')
        expect(changes[0].path).toContain('List Users')
        expect(changes[0].newContent).toContain('GET /users')
        expect(changes[0].oldContent).toBeUndefined()
    })

    it('removed', async () => {
        const local = makeDoc({
            '/pets': petsGet,
            '/users': { get: { summary: 'List Users', responses: ok200 } }
        })
        const remote = makeDoc({ '/pets': petsGet })

        const changes = await diffSources(local, remote)

        expect(changes).toHaveLength(1)
        expect(changes[0].kind).toBe('removed')
        expect(changes[0].path).toContain('List Users')
        expect(changes[0].oldContent).toContain('GET /users')
        expect(changes[0].newContent).toBeUndefined()
    })

    it('modified', async () => {
        const local = makeDoc({ '/pets': petsGet })
        const remote = makeDoc({
            '/pets': {
                get: {
                    summary: 'List Pets',
                    parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }],
                    responses: ok200
                }
            }
        })

        const path = pathOf(sourceDiskPath, 'List Pets.get')
        fs.create(path)
        fs.writeText(path, 'GET /pets')

        const changes = await diffSources(local, remote, sourceDiskPath)
        

        expect(changes).toHaveLength(1)
        expect(changes[0].kind).toBe('modified')
        expect(changes[0].newContent).toContain('?status=<status>')
        expect(changes[0].oldContent).not.toContain('status')
    })

    it('modified newContent is the merged result preserving on disk values', async () => {
        const local = makeDoc({
            '/pets': { get: { summary: 'List Pets', parameters: [param('status')], responses: ok200 } }
        })

        const remote = makeDoc({
            '/pets': { get: { summary: 'List Pets', parameters: [param('status'), param('limit')], responses: ok200 } }
        })


        const path = pathOf(sourceDiskPath, 'List Pets.get') //'/tmp/Test API/List Pets.get'

        await fs.create(path)
        await fs.writeText(path, 'GET /pets?status=available')


        const changes = await diffSources(local, remote, sourceDiskPath)

        expect(changes).toHaveLength(1)
        expect(changes[0].kind).toBe('modified')
        // merged: old 'status' value preserved, new 'limit' placeholder added
        expect(changes[0].newContent).toContain('status=available')
        expect(changes[0].newContent).toContain('limit=<limit>')
        // raw remote would have reset status to '<status>' — must not happen
        expect(changes[0].newContent).not.toContain('status=<status>')
    })

    it('does not flag modified when local has a user-filled query value that satisfies the new placeholder', async () => {
        const local = makeDoc({
            '/pets': { get: { summary: 'List Pets', parameters: [param('status', 'mystatus')], responses: ok200 } }
        })
        const remote = makeDoc({
            '/pets': { get: { summary: 'List Pets', parameters: [param('status')], responses: ok200 } }
        })

        const changes = await diffSources(local, remote)

        expect(changes).toHaveLength(0)
    })

    it('does not flag modified when merged content equals local content', async () => {
        const local = makeDoc({
            '/pets': {
                get: {
                    summary: 'List Pets',
                    parameters: [{ name: 'Authorization', in: 'header', schema: { type: 'string' } }],
                    responses: ok200
                }
            }
        })
        const remote = makeDoc({ '/pets': petsGet })

        const changes = await diffSources(local, remote)

        expect(changes).toHaveLength(0)
    })
})
