import { fs } from "memfs";
import { beforeEach, describe, expect, it } from "vitest";
import { pathOf } from "../files/join";
import { readBasePath } from "./http-runner";
import { err } from "true-myth/result";

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