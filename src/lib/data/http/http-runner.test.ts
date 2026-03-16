import { fs } from "memfs";
import { beforeEach, describe, expect, it } from "vitest";
import { pathOf } from "../files/join";
import executeHttpTemplate, { readBasePath } from "./http-runner";
import { err } from "true-myth/result";
import { beforeScriptPath } from "./before-script-executor";
import { afterScriptPath } from "./after-script-executor";
import { serializeEnvironments } from "../project/serialize-environments";
import { HttpClient, HttpError, HttpRequest, HttpResponse } from "./client/http-client";
import Task from "true-myth/task";


describe('execute http template', () => {
    const root = '/home/user';
    const template = 'GET https://postman-echo.com/get'
    const templatePath = pathOf(root, 'template.http');
    const before = beforeScriptPath(templatePath);
    const after = afterScriptPath(templatePath);
    const envPath = pathOf(root, 'environments.cenv');

    const client = new TestHttpClient();

    beforeEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
        fs.mkdirSync(root, { recursive: true });
    });

    const executeTemplate = (request = template, abortController = new AbortController()) => {
        return executeHttpTemplate(request, templatePath, [], abortController, envPath, 'production', client)
    }

    it('executes template', async () => {
        const result = await executeTemplate();
        expect(result.isOk).toBe(true);
        expect(result.unwrapOr(null)!.response.status).toBe(200);
    })

    describe('scripts', () => {
        it('sets environment variables', async () => {
            fs.writeFileSync(after, 'setEnvironmentVariable("testKey", "testValue")');
            fs.writeFileSync(envPath, serializeEnvironments([{
                name: 'production', variables: [
                    { key: 'api', value: 'http://' }
                ]
            }]));
            await executeTemplate();
            const envContent = fs.readFileSync(envPath, 'utf-8');
            expect(envContent).toBe(serializeEnvironments([{
                name: 'production', variables: [
                    { key: 'api', value: 'http://' },
                    { key: 'testKey', value: 'testValue' }
                ]
            }]));
        })
    })

    it('cancelles request when aborted', async () => {
        const abort = new AbortController()
        abort.abort();
        const result = await executeTemplate(template, abort);
        expect(result.isErr).toBe(true);
        result.isErr && expect(result.error.type).toBe('abort');
    })

    describe('errors', () => {
        it('template error when resolveHttp fails', async () => {
            fs.writeFileSync(before, 'throw new Error("failed")');
            const result = await executeTemplate(template + '<api>');
            expect(result.isErr).toBe(true);
            result.isErr && expect(result.error.type).toBe('template');
        })

        it('script error when before script fails', async () => {
            fs.writeFileSync(before, 'throw new Error("failed")');
            const result = await executeTemplate();
            expect(result.isErr).toBe(true);
            result.isErr && expect(result.error.type).toBe('script');
        })

        it('has script error when after script fails', async () => {
            fs.writeFileSync(after, 'throw new Error("failed")');
            const result = await executeTemplate();
            expect(result.isOk).toBe(true);
            expect(result.unwrapOr(null)!.afterScriptError).toBeDefined();
        })

    })
})


describe('base path provider', () => {

    const root = '/home/user';

    beforeEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
        fs.mkdirSync(root, { recursive: true });
    });

    const writePath = (path: string) => fs.writeFileSync(pathOf(root, 'settings.json'), JSON.stringify({ baseUrl: path }));

    it('returns the base path from settings', async () => {
        writePath('https://getpostchi.org');
        const basePath = await readBasePath(pathOf(root, 'some', 'request.get'))

        expect(basePath.unwrapOr('')).toBe('https://getpostchi.org');
    })


    it('resolved variable base path', async () => {
        const variables = new Map([
            ['api', 'https://getpostchi.com/']
        ])

        writePath('<api>');

        const basePath = await readBasePath(pathOf(root, 'some', 'request.get'), variables)
        expect(basePath.unwrapOr('')).toBe('https://getpostchi.com');
    })

    it('ignores trailing slash in base URL', async () => {

        writePath('https://getpostchi.com/');

        const basePath = await readBasePath(pathOf(root, 'some', 'request.get'))

        expect(basePath.unwrapOr('')).toBe('https://getpostchi.com');
    })

    it('returns error when relative URL without base URL', async () => {

        const basePath = await readBasePath(pathOf(root, 'some', 'request.get'))
        expect(basePath).toStrictEqual(err({ message: 'base path is not set' }));
    })

    it('returns error when base url is not absolute', async () => {

        writePath('getpostchi.com');
        const basePath = await readBasePath(pathOf(root, 'some', 'request.get'))
        expect(basePath).toStrictEqual(err({ message: 'base path is not valid' }));
    })

    it('returns error when base url is unknown variables', async () => {

        writePath('<unknownVariable>');
        const basePath = await readBasePath(pathOf(root, 'some', 'request.get'))
        expect(basePath).toStrictEqual(err({ message: 'variable set as base path is not defined in the active environment' }));
    })
})

class TestHttpClient implements HttpClient {
    fetch(request: HttpRequest, abortSignal: AbortSignal): Task<HttpResponse, HttpError> {
        return new Task((resolve, reject) => {
            if (abortSignal.aborted) {
                reject({
                    type: 'abort',
                    message: 'Request was aborted'
                });
                return;
            }
            resolve({
                request,
                raw: new Response(),
                status: 200,
                headers: new Headers(),
                body: '',
                contentTypeInfo: { kind: 'text', mimeType: 'text/plain', type: 'text', parseable: true }
            })
        });
    }
}