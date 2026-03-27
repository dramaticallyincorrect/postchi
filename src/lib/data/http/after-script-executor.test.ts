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
    const emptyMutations = { envMutations: [], secretMutations: [] };

    const run = (scriptContent?: string, variables: { key: string; value: string }[] = []) => {
        if (scriptContent) fs.writeFileSync(`${root}/login.after.js`, scriptContent);
        return executeAfterScript(requestPath, baseRequest, baseResponse, variables);
    };

    it('resolves with empty mutations when no after script exists', async () => {
        await expect(run()).resolves.toEqual(emptyMutations);
    });

    it('exposes response status to the script', async () => {
        await expect(run(`if (response.status !== 200) throw new Error('unexpected status');`)).resolves.toEqual(emptyMutations);
    });

    it('exposes response body to the script', async () => {
        await expect(run(`
            const data = JSON.parse(response.body);
            if (data.token !== 'abc123') throw new Error('wrong token');
        `)).resolves.toEqual(emptyMutations);
    });

    it('exposes response headers to the script', async () => {
        await expect(run(`
            if (response.headers['content-type'] !== 'application/json') throw new Error('wrong content-type');
        `)).resolves.toEqual(emptyMutations);
    });

    it('exposes the final request to the script', async () => {
        await expect(run(`
            if (request.method !== 'GET') throw new Error('wrong method');
            if (request.url !== 'https://example.com/api') throw new Error('wrong url');
        `)).resolves.toEqual(emptyMutations);
    });

    it('exposes env variables to the script', async () => {
        fs.writeFileSync(`${root}/login.after.js`, `
            if (env.EXPECTED_STATUS !== '200') throw new Error('env not available');
        `);
        await expect(
            executeAfterScript(requestPath, baseRequest, baseResponse, [{ key: 'EXPECTED_STATUS', value: '200' }])
        ).resolves.toEqual(emptyMutations);
    });

    it('throws when the script throws', async () => {
        await expect(run(`throw new Error('assertion failed');`)).rejects.toThrow('assertion failed');
    });

    it('body is null for binary responses', async () => {
        const binaryResponse: ScriptResponse = { ...baseResponse, body: null };
        fs.writeFileSync(`${root}/login.after.js`, `
            if (response.body !== null) throw new Error('expected null body');
        `);
        await expect(
            executeAfterScript(requestPath, baseRequest, binaryResponse, [])
        ).resolves.toEqual(emptyMutations);
    });

    it('returns env mutation from setEnvironmentVariable', async () => {
        const result = await run(`
            const data = JSON.parse(response.body);
            setEnvironmentVariable('token', data.token);
        `);
        expect(result.envMutations).toEqual([{ key: 'token', value: 'abc123' }]);
        expect(result.secretMutations).toEqual([]);
    });

    it('returns secret mutation from setSecret', async () => {
        const result = await run(`
            const data = JSON.parse(response.body);
            setSecret('token', data.token);
        `);
        expect(result.secretMutations).toEqual([{ key: 'token', value: 'abc123' }]);
        expect(result.envMutations).toEqual([]);
    });

    it('returns mutations from both setEnvironmentVariable and setSecret', async () => {
        const result = await run(`
            const data = JSON.parse(response.body);
            setEnvironmentVariable('env_token', data.token);
            setSecret('secret_token', data.token);
        `);
        expect(result.envMutations).toEqual([{ key: 'env_token', value: 'abc123' }]);
        expect(result.secretMutations).toEqual([{ key: 'secret_token', value: 'abc123' }]);
    });
});
