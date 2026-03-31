import { describe, expect, it } from "vitest";
import { diffSources } from "./source-checker";
import { OpenAPIV3 } from "openapi-types";

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

describe('diffSources', () => {
    it('add', () => {
        const local = makeDoc({ '/pets': petsGet })
        const remote = makeDoc({
            '/pets': petsGet,
            '/users': { get: { summary: 'List Users', responses: ok200 } }
        })

        const changes = diffSources(local, remote)

        expect(changes).toHaveLength(1)
        expect(changes[0].kind).toBe('added')
        expect(changes[0].path).toContain('List Users')
        expect(changes[0].newContent).toContain('GET /users')
        expect(changes[0].oldContent).toBeUndefined()
    })

    it('removed', () => {
        const local = makeDoc({
            '/pets': petsGet,
            '/users': { get: { summary: 'List Users', responses: ok200 } }
        })
        const remote = makeDoc({ '/pets': petsGet })

        const changes = diffSources(local, remote)

        expect(changes).toHaveLength(1)
        expect(changes[0].kind).toBe('removed')
        expect(changes[0].path).toContain('List Users')
        expect(changes[0].oldContent).toContain('GET /users')
        expect(changes[0].newContent).toBeUndefined()
    })

    it('modified', () => {
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

        const changes = diffSources(local, remote)

        expect(changes).toHaveLength(1)
        expect(changes[0].kind).toBe('modified')
        expect(changes[0].newContent).toContain('?status=<status>')
        expect(changes[0].oldContent).not.toContain('status')
    })

    it('modified newContent is the merged result preserving local values', () => {
        // Local has 'status' query param with a user-filled value via schema example.
        // Remote adds a new 'limit' param but keeps 'status' as a placeholder.
        //
        // mergeRequestContent preserves the old 'status' value ("available") and adds 'limit':
        // → GET /pets?status=available&limit=<limit>
        //
        // newContent must be the merged result — not the raw remote string
        // which would reset 'status' back to '<status>'.
        const local = makeDoc({
            '/pets': { get: { summary: 'List Pets', parameters: [param('status', 'available')], responses: ok200 } }
        })
        const remote = makeDoc({
            '/pets': { get: { summary: 'List Pets', parameters: [param('status'), param('limit')], responses: ok200 } }
        })

        const changes = diffSources(local, remote)

        expect(changes).toHaveLength(1)
        expect(changes[0].kind).toBe('modified')
        // merged: old 'status' value preserved, new 'limit' placeholder added
        expect(changes[0].newContent).toContain('status=available')
        expect(changes[0].newContent).toContain('limit=<limit>')
        // raw remote would have reset status to '<status>' — must not happen
        expect(changes[0].newContent).not.toContain('status=<status>')
    })

    it('does not flag modified when local has a user-filled query value that satisfies the new placeholder', () => {
        // Local has status=mystatus (user filled in the placeholder).
        // Remote spec still has status=<status> (unchanged placeholder).
        // mergeRequestContent keeps "mystatus" since <status> is just a placeholder —
        // merged == local, so no effective change and the file should not be flagged.
        const local = makeDoc({
            '/pets': { get: { summary: 'List Pets', parameters: [param('status', 'mystatus')], responses: ok200 } }
        })
        const remote = makeDoc({
            '/pets': { get: { summary: 'List Pets', parameters: [param('status')], responses: ok200 } }
        })

        const changes = diffSources(local, remote)

        expect(changes).toHaveLength(0)
    })

    it('does not flag modified when merged content equals local content', () => {
        // Local has an Authorization header param; remote drops it.
        //
        // Raw comparison:  'GET /pets\nAuthorization: <Authorization>' ≠ 'GET /pets'
        //   → would be flagged as modified under a naïve string-equality check.
        //
        // Merge comparison: mergeRequestContent preserves user-added headers that are
        //   absent from the new spec, so merge(local, remote) == local
        //   → no effective change → should NOT appear in the diff.
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

        const changes = diffSources(local, remote)

        expect(changes).toHaveLength(0)
    })
})
