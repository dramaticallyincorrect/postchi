import { fs } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { afterScriptPath, executeAfterScript, ScriptResponse } from './after-script-executor';
import { HttpRequest } from './client/http-client';

const root = '/home/user/collections';

const baseRequest: HttpRequest = {
    method: 'GET',
    url: 'https://example.com/api',
    headers: [['Content-Type', 'application/json']],
    body: '',
};

const baseResponse: ScriptResponse = {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: '{"token":"abc123"}',
};

describe('afterScriptPath', () => {
    it('derives .after.js path from .get file', () => {
        expect(afterScriptPath('/path/to/login.get')).toBe('/path/to/login.after.js');
    });

    it('handles files with dots in name', () => {
        expect(afterScriptPath('/path/to/my.request.get')).toBe('/path/to/my.request.after.js');
    });
});

describe('executeAfterScript', () => {
    beforeEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
        fs.mkdirSync(root, { recursive: true });
    });

    const requestPath = `${root}/login.get`;

    it('returns empty mutations when no after script exists', async () => {
        await expect(executeAfterScript(requestPath, baseRequest, baseResponse, [])).resolves.toEqual([]);
    });

    it('exposes response status to the script', async () => {
        // We can't capture values out of the sandbox directly, so we verify
        // that accessing response.status doesn't throw.
        fs.writeFileSync(`${root}/login.after.js`, `if (response.status !== 200) throw new Error('unexpected status');`);

        await expect(executeAfterScript(requestPath, baseRequest, baseResponse, [])).resolves.toEqual([]);
    });

    it('exposes response body to the script', async () => {
        fs.writeFileSync(`${root}/login.after.js`, `
            const data = JSON.parse(response.body);
            if (data.token !== 'abc123') throw new Error('wrong token');
        `);

        await expect(executeAfterScript(requestPath, baseRequest, baseResponse, [])).resolves.toEqual([]);
    });

    it('exposes response headers to the script', async () => {
        fs.writeFileSync(`${root}/login.after.js`, `
            if (response.headers['content-type'] !== 'application/json') throw new Error('wrong content-type');
        `);

        await expect(executeAfterScript(requestPath, baseRequest, baseResponse, [])).resolves.toEqual([]);
    });

    it('exposes the final request to the script', async () => {
        fs.writeFileSync(`${root}/login.after.js`, `
            if (request.method !== 'GET') throw new Error('wrong method');
            if (request.url !== 'https://example.com/api') throw new Error('wrong url');
        `);

        await expect(executeAfterScript(requestPath, baseRequest, baseResponse, [])).resolves.toEqual([]);
    });

    it('exposes env variables to the script', async () => {
        fs.writeFileSync(`${root}/login.after.js`, `
            if (env.EXPECTED_STATUS !== '200') throw new Error('env not available');
        `);

        await expect(
            executeAfterScript(requestPath, baseRequest, baseResponse, [{ key: 'EXPECTED_STATUS', value: '200' }])
        ).resolves.toEqual([]);
    });

    it('throws when the script throws', async () => {
        fs.writeFileSync(`${root}/login.after.js`, `throw new Error('assertion failed');`);

        await expect(executeAfterScript(requestPath, baseRequest, baseResponse, [])).rejects.toThrow('assertion failed');
    });

    it('body is null for binary responses', async () => {
        const binaryResponse: ScriptResponse = { ...baseResponse, body: null };
        fs.writeFileSync(`${root}/login.after.js`, `
            if (response.body !== null) throw new Error('expected null body');
        `);

        await expect(executeAfterScript(requestPath, baseRequest, binaryResponse, [])).resolves.toEqual([]);
    });

    it('collects env mutations from setEnvironmentVariable', async () => {
        fs.writeFileSync(`${root}/login.after.js`, `
            const data = JSON.parse(response.body);
            setEnvironmentVariable('token', data.token);
        `);

        const mutations = await executeAfterScript(requestPath, baseRequest, baseResponse, []);

        expect(mutations).toEqual([{ key: 'token', value: 'abc123' }]);
    });
});
