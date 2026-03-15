import { fs } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { beforeScriptPath, executeBeforeScript } from './before-script-executor';
import { HttpRequest } from './http-template-resolver';

const root = '/home/user/collections';

const baseRequest: HttpRequest = {
    method: 'GET',
    url: 'https://example.com/api',
    headers: [['Content-Type', 'application/json']],
    body: '',
};

describe('beforeScriptPath', () => {
    it('derives .before.js path from .get file', () => {
        expect(beforeScriptPath('/path/to/login.get')).toBe('/path/to/login.before.js');
    });

    it('handles files with dots in name', () => {
        expect(beforeScriptPath('/path/to/my.request.get')).toBe('/path/to/my.request.before.js');
    });
});

describe('executeBeforeScript', () => {
    beforeEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
        fs.mkdirSync(root, { recursive: true });
    });

    const requestPath = `${root}/login.get`;

    it('returns original request when no before script exists', async () => {
        const result = await executeBeforeScript(requestPath, baseRequest, []);
        expect(result).toStrictEqual(baseRequest);
    });

    it('adds a header via the before script', async () => {
        fs.writeFileSync(`${root}/login.before.js`, `request.headers['Authorization'] = 'Bearer token123';`);

        const result = await executeBeforeScript(requestPath, baseRequest, []);

        expect(result.headers).toContainEqual(['Authorization', 'Bearer token123']);
    });

    it('modifies the URL via the before script', async () => {
        fs.writeFileSync(`${root}/login.before.js`, `request.url += '?debug=true';`);

        const result = await executeBeforeScript(requestPath, baseRequest, []);

        expect(result.url).toBe('https://example.com/api?debug=true');
    });

    it('exposes env variables to the script', async () => {
        fs.writeFileSync(`${root}/login.before.js`, `request.headers['X-Token'] = env.TOKEN;`);

        const result = await executeBeforeScript(requestPath, baseRequest, [{ key: 'TOKEN', value: 'secret' }]);

        expect(result.headers).toContainEqual(['X-Token', 'secret']);
    });

    it('preserves original headers alongside added ones', async () => {
        fs.writeFileSync(`${root}/login.before.js`, `request.headers['X-Extra'] = 'extra';`);

        const result = await executeBeforeScript(requestPath, baseRequest, []);

        expect(result.headers).toContainEqual(['Content-Type', 'application/json']);
        expect(result.headers).toContainEqual(['X-Extra', 'extra']);
    });

    it('throws when the script throws', async () => {
        fs.writeFileSync(`${root}/login.before.js`, `throw new Error('oops');`);

        await expect(executeBeforeScript(requestPath, baseRequest, [])).rejects.toThrow('oops');
    });

    it('preserves FormData body without mutation', async () => {
        const formData = new FormData();
        formData.append('key', 'value');
        const requestWithForm: HttpRequest = { ...baseRequest, body: formData };

        fs.writeFileSync(`${root}/login.before.js`, ``);

        const result = await executeBeforeScript(requestPath, requestWithForm, []);

        expect(result.body).toBe(formData);
    });
});
