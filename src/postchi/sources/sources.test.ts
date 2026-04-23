import { describe, expect, it } from "vitest";
import { projectForPath, sourcesFileName } from "../project/project";
import { addSource, deleteSource, readSources, Source, SourcesConfig, sourcesFilePath, writeSources } from "./sources";
import { fs } from "memfs";
import { join } from "node:path";

describe('sources persitent', () => {

    const path = '/temp/project'
    const project = projectForPath(path)
    const sourcesPath = sourcesFilePath(path)
    fs.mkdirSync(`${path}/.postchi`, { recursive: true })

    it('returns correct source file', () => {
        const expected = `/temp/project/.postchi/${sourcesFileName}`

        expect(sourcesFilePath(path)).toBe(expected)

    })


    it('returnes all sources', async () => {

        const config: SourcesConfig = {
            sources: [
                {
                    url: 'https://someurl.com',
                    type: 'open-api',
                    path: 'some api',
                    absolutePath: join(project.collectionsPath, 'some api')
                }
            ]
        }

        await writeSources(path, config)
        expect(fs.readFileSync(sourcesPath)).not.toContain('absolutePath')

        expect(await readSources(path)).toStrictEqual({
            sources: [
                {
                    url: 'https://someurl.com',
                    type: 'open-api',
                    path: 'some api',
                    absolutePath: join(project.collectionsPath, 'some api')
                }
            ]
        })

    })

    it('replaces existing sources', async () => {

        const existing: SourcesConfig = {
            sources: [
                {
                    url: 'https://someurl.com',
                    type: 'open-api',
                    path: 'some api',
                    absolutePath: join(project.collectionsPath, 'some api')
                }
            ]
        }

        const config: SourcesConfig = {
            sources: [
                {
                    url: 'https://adfs.com',
                    type: 'open-api',
                    path: 'ta da',
                    absolutePath: join(project.collectionsPath, 'ta da')
                }
            ]
        }

        await writeSources(path, existing)
        expect(fs.readFileSync(sourcesPath)).not.toContain('absolutePath')
        expect(await readSources(path)).toStrictEqual(existing)

        await writeSources(path, config)

        expect(await readSources(path)).toStrictEqual(config)

    })

    it('adds to existing sources', async () => {

        const existing: Source = {
            url: 'https://someurl.com',
            type: 'open-api',
            path: 'some api',
            absolutePath: join(project.collectionsPath, 'some api')
        }

        const newSource: Source = {
            url: 'https://adfs.com',
            type: 'open-api',
            path: 'ta da',
            absolutePath: join(project.collectionsPath, 'ta da')
        }

        const config: SourcesConfig = {
            sources: [
                existing,
                newSource
            ]
        }

        await writeSources(path, {
            sources: [
                existing
            ]
        })


        await addSource(path, newSource)

        expect(await readSources(path)).toStrictEqual(config)

    })

    it('deletes existing sources', async () => {

        const existing: Source = {
            url: 'https://someurl.com',
            type: 'open-api',
            path: 'some api',
            absolutePath: join(project.collectionsPath, 'some api')
        }

        const toBeRemoved: Source = {
            url: 'https://adfs.com',
            type: 'open-api',
            path: 'ta da',
            absolutePath: join(project.collectionsPath, 'ta da')
        }

        const expected: SourcesConfig = {
            sources: [
                existing,
            ]
        }

        await writeSources(path, {
            sources: [
                existing,
                toBeRemoved
            ]
        })


        await deleteSource(toBeRemoved.path, projectForPath(path))

        expect(await readSources(path)).toStrictEqual(expected)

    })


})