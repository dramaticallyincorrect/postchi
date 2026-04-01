import { beforeEach, describe, expect, it } from 'vitest'
import { fs } from 'memfs'
import * as yaml from 'js-yaml'
import { resolveRequestAuth } from './auth-resolver'
import { pathOf } from '@/lib/storage/files/join'
import { FolderSettings } from '@/postchi/project/project'
import { RequestSpec } from '@/postchi/sources/request-spec'

const root = '/auth-resolver-test'
const requestPath = pathOf(root, 'request.get')
const specPath = pathOf(root, 'request.spec.yaml')
const settingsPath = pathOf(root, 'settings.json')

function writeSettings(settings: FolderSettings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings))
}

function writeSpec(spec: Partial<RequestSpec> & { operation: RequestSpec['operation'] }) {
    fs.writeFileSync(specPath, yaml.dump(spec))
}

beforeEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
    fs.mkdirSync(root, { recursive: true })
    // Create a minimal request file so readSettingsForRequest can walk from its directory
    fs.writeFileSync(requestPath, 'GET /test')
})

// ---------------------------------------------------------------------------
// No configuration
// ---------------------------------------------------------------------------

describe('no configuration', () => {
    it('returns empty array when there is no settings.json', async () => {
        const result = await resolveRequestAuth(requestPath, new Map())
        expect(result).toEqual([])
    })

    it('returns empty array when settings.json has no security field', async () => {
        writeSettings({ baseUrl: 'https://api.example.com' })
        const result = await resolveRequestAuth(requestPath, new Map())
        expect(result).toEqual([])
    })

    it('returns empty array when settings.json has an empty security array', async () => {
        writeSettings({ baseUrl: '', security: [] })
        const result = await resolveRequestAuth(requestPath, new Map())
        expect(result).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// Bearer auth
// ---------------------------------------------------------------------------

describe('http bearer', () => {
    beforeEach(() => {
        writeSettings({
            baseUrl: '',
            security: [{ bearer: { type: 'http', scheme: 'bearer', tokenVariable: 'MY_TOKEN' } }],
        })
    })

    it('injects Authorization Bearer header when variable is present', async () => {
        const result = await resolveRequestAuth(requestPath, new Map([['MY_TOKEN', 'abc123']]))
        expect(result).toEqual([['Authorization', 'Bearer abc123']])
    })

    it('returns empty array when token variable is missing from env', async () => {
        const result = await resolveRequestAuth(requestPath, new Map())
        expect(result).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// Basic auth
// ---------------------------------------------------------------------------

describe('http basic', () => {
    beforeEach(() => {
        writeSettings({
            baseUrl: '',
            security: [{
                basic: {
                    type: 'http',
                    scheme: 'basic',
                    usernameVariable: 'MY_USER',
                    passwordVariable: 'MY_PASS',
                },
            }],
        })
    })

    it('injects Authorization Basic header when both variables are present', async () => {
        const result = await resolveRequestAuth(requestPath, new Map([['MY_USER', 'alice'], ['MY_PASS', 's3cr3t']]))
        const expected = `Basic ${btoa('alice:s3cr3t')}`
        expect(result).toEqual([['Authorization', expected]])
    })

    it('returns empty array when username variable is missing', async () => {
        const result = await resolveRequestAuth(requestPath, new Map([['MY_PASS', 's3cr3t']]))
        expect(result).toEqual([])
    })

    it('returns empty array when password variable is missing', async () => {
        const result = await resolveRequestAuth(requestPath, new Map([['MY_USER', 'alice']]))
        expect(result).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// API key auth
// ---------------------------------------------------------------------------

describe('apiKey', () => {
    it('injects named header when apiKey is in header and variable is present', async () => {
        writeSettings({
            baseUrl: '',
            security: [{ apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'MY_KEY' } }],
        })
        const result = await resolveRequestAuth(requestPath, new Map([['MY_KEY', 'key-value']]))
        expect(result).toEqual([['X-API-Key', 'key-value']])
    })

    it('returns empty array when apiKey variable is missing', async () => {
        writeSettings({
            baseUrl: '',
            security: [{ apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'MY_KEY' } }],
        })
        const result = await resolveRequestAuth(requestPath, new Map())
        expect(result).toEqual([])
    })

    it('produces no header (and does not fail) when apiKey is in query', async () => {
        writeSettings({
            baseUrl: '',
            security: [{ apiKey: { type: 'apiKey', name: 'token', in: 'query', keyVariable: 'MY_KEY' } }],
        })
        const result = await resolveRequestAuth(requestPath, new Map([['MY_KEY', 'key-value']]))
        expect(result).toEqual([])
    })

    it('produces no header (and does not fail) when apiKey is in cookie', async () => {
        writeSettings({
            baseUrl: '',
            security: [{ apiKey: { type: 'apiKey', name: 'session', in: 'cookie', keyVariable: 'MY_KEY' } }],
        })
        const result = await resolveRequestAuth(requestPath, new Map([['MY_KEY', 'key-value']]))
        expect(result).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// OR semantics (multiple SecurityRequirements)
// ---------------------------------------------------------------------------

describe('OR semantics', () => {
    it('uses the first satisfiable requirement', async () => {
        writeSettings({
            baseUrl: '',
            security: [
                { bearer: { type: 'http', scheme: 'bearer', tokenVariable: 'BEARER_TOKEN' } },
                { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'API_KEY' } },
            ],
        })
        // Only the second variable is available — should fall through to second requirement
        const result = await resolveRequestAuth(requestPath, new Map([['API_KEY', 'mykey']]))
        expect(result).toEqual([['X-API-Key', 'mykey']])
    })

    it('uses the first requirement when both are satisfiable', async () => {
        writeSettings({
            baseUrl: '',
            security: [
                { bearer: { type: 'http', scheme: 'bearer', tokenVariable: 'BEARER_TOKEN' } },
                { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'API_KEY' } },
            ],
        })
        const result = await resolveRequestAuth(requestPath, new Map([
            ['BEARER_TOKEN', 'tok'],
            ['API_KEY', 'mykey'],
        ]))
        expect(result).toEqual([['Authorization', 'Bearer tok']])
    })

    it('returns empty array when no requirement is satisfiable', async () => {
        writeSettings({
            baseUrl: '',
            security: [
                { bearer: { type: 'http', scheme: 'bearer', tokenVariable: 'BEARER_TOKEN' } },
                { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'API_KEY' } },
            ],
        })
        const result = await resolveRequestAuth(requestPath, new Map())
        expect(result).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// AND semantics (multiple methods in one SecurityRequirement)
// ---------------------------------------------------------------------------

describe('AND semantics', () => {
    it('injects all headers when all variables in a requirement are present', async () => {
        writeSettings({
            baseUrl: '',
            security: [{
                bearer: { type: 'http', scheme: 'bearer', tokenVariable: 'BEARER_TOKEN' },
                apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'API_KEY' },
            }],
        })
        const result = await resolveRequestAuth(requestPath, new Map([
            ['BEARER_TOKEN', 'tok'],
            ['API_KEY', 'mykey'],
        ]))
        expect(result).toContainEqual(['Authorization', 'Bearer tok'])
        expect(result).toContainEqual(['X-API-Key', 'mykey'])
        expect(result).toHaveLength(2)
    })

    it('returns empty array when any variable in the AND requirement is missing', async () => {
        writeSettings({
            baseUrl: '',
            security: [{
                bearer: { type: 'http', scheme: 'bearer', tokenVariable: 'BEARER_TOKEN' },
                apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'API_KEY' },
            }],
        })
        // Only one of the two is present — entire requirement is unsatisfiable
        const result = await resolveRequestAuth(requestPath, new Map([['BEARER_TOKEN', 'tok']]))
        expect(result).toEqual([])
    })

    it('falls through to next OR requirement when AND requirement is partially unsatisfiable', async () => {
        writeSettings({
            baseUrl: '',
            security: [
                // AND: both required — will fail because API_KEY is absent
                {
                    bearer: { type: 'http', scheme: 'bearer', tokenVariable: 'BEARER_TOKEN' },
                    apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'API_KEY' },
                },
                // OR fallback: only bearer
                { bearer2: { type: 'http', scheme: 'bearer', tokenVariable: 'BEARER_TOKEN' } },
            ],
        })
        const result = await resolveRequestAuth(requestPath, new Map([['BEARER_TOKEN', 'tok']]))
        expect(result).toEqual([['Authorization', 'Bearer tok']])
    })
})

// ---------------------------------------------------------------------------
// Per-request spec file override
// ---------------------------------------------------------------------------

describe('spec file override', () => {
    beforeEach(() => {
        writeSettings({
            baseUrl: '',
            security: [{ bearer: { type: 'http', scheme: 'bearer', tokenVariable: 'MY_TOKEN' } }],
        })
    })

    it('skips folder auth when spec file has an explicit security override', async () => {
        writeSpec({
            method: 'get',
            path: '/pets',
            operation: { security: [{ apiKey: [] }] },
        })
        const result = await resolveRequestAuth(requestPath, new Map([['MY_TOKEN', 'tok']]))
        expect(result).toEqual([])
    })

    it('skips folder auth when spec file has security: [] (explicit no-auth)', async () => {
        writeSpec({
            method: 'get',
            path: '/public',
            operation: { security: [] },
        })
        const result = await resolveRequestAuth(requestPath, new Map([['MY_TOKEN', 'tok']]))
        expect(result).toEqual([])
    })

    it('applies folder auth when spec file exists but operation.security is absent', async () => {
        writeSpec({
            method: 'get',
            path: '/pets',
            // No security field — inherits folder auth
            operation: {},
        })
        const result = await resolveRequestAuth(requestPath, new Map([['MY_TOKEN', 'tok']]))
        expect(result).toEqual([['Authorization', 'Bearer tok']])
    })

    it('applies folder auth when no spec file exists at all', async () => {
        // No spec file written
        const result = await resolveRequestAuth(requestPath, new Map([['MY_TOKEN', 'tok']]))
        expect(result).toEqual([['Authorization', 'Bearer tok']])
    })
})
