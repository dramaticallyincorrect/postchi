import { describe, expect, it } from "vitest";
import { applySourceChanges } from "./source-applier";
import { Source } from "./sources";
import { fs } from "memfs";
import { REQUEST_SPEC_FILENAME_SUFFIX } from "./request-spec";
import { patchFolderSettings, readFolderSettings, SecurityRequirement } from "../project/project";

describe('source change applier', () => {

    const path = '/temp/project/requests/swagger/'
    const requestPath = '/temp/project/requests/swagger/myrequest.chttp'
    const changeSpecPath = `/temp/project/requests/swagger/myrequest${REQUEST_SPEC_FILENAME_SUFFIX}`
    fs.mkdirSync(path, { recursive: true })

    const source: Source = {
        type: 'open-api',
        url: 'url',
        path: 'path',
        absolutePath: '/temp/project/requests/swagger'
    }

    describe('updates request and persits the spec', () => {
        it('added', async () => {

            await applySourceChanges(
                [
                    {
                        source,
                        changes: [
                            {
                                kind: 'added',
                                path: requestPath,
                                newContent: 'this should be stored',
                                spec: {
                                    method: 'GET',
                                    operation: {},
                                    path: 'some path'
                                }
                            }
                        ],
                        remoteDoc: {
                            openapi: '3.0.0',
                            info: { title: 'Test API', version: '1.0.0' },
                            paths: {}
                        }
                    }
                ],
            )

            expect(fs.readFileSync(requestPath).toString()).toBe('this should be stored')
            expect(fs.existsSync(changeSpecPath)).toBe(true)

        })

        it('modified', async () => {


            await applySourceChanges(
                [
                    {
                        source,
                        changes: [
                            {
                                kind: 'modified',
                                path: requestPath,
                                newContent: 'this should be stored',
                                spec: {
                                    method: 'GET',
                                    operation: {},
                                    path: 'some path'
                                }
                            }
                        ],
                        remoteDoc: {
                            openapi: '3.0.0',
                            info: { title: 'Test API', version: '1.0.0' },
                            paths: {}
                        }
                    }
                ],
            )

            expect(fs.readFileSync(requestPath).toString()).toBe('this should be stored')
            expect(fs.existsSync(changeSpecPath)).toBe(true)

        })

        it('removed', async () => {

            fs.writeFileSync(changeSpecPath, 'sdfsdf')
            fs.writeFileSync(requestPath, 'sdfsdf')

            await applySourceChanges(
                [
                    {
                        source,
                        changes: [
                            {
                                kind: 'removed',
                                path: requestPath,
                                newContent: 'this should be stored',
                                spec: {
                                    method: 'GET',
                                    operation: {},
                                    path: 'some path'
                                }
                            }
                        ],
                        remoteDoc: {
                            openapi: '3.0.0',
                            info: { title: 'Test API', version: '1.0.0' },
                            paths: {}
                        }
                    }
                ],
            )

            expect(fs.existsSync(requestPath)).toBe(false)
            expect(fs.existsSync(changeSpecPath)).toBe(false)

        })

        it('spec only change writes the spec', async () => {
            await applySourceChanges(
                [
                    {
                        source,
                        changes: [
                            {
                                kind: 'spec',
                                path: requestPath,
                                newContent: undefined,
                                spec: {
                                    method: 'GET',
                                    operation: {},
                                    path: 'some path'
                                }
                            }
                        ],
                        remoteDoc: {
                            openapi: '3.0.0',
                            info: { title: 'Test API', version: '1.0.0' },
                            paths: {}
                        }
                    }
                ],
            )

            expect(fs.existsSync(changeSpecPath)).toBe(true)

        })
    })


    describe('merges security changes while preserving on disk values for variables', () => {

        const baseUrl = 'https://getpostchi.com'

        const givenExistingSettings = async (requirement: SecurityRequirement) => await patchFolderSettings(source.absolutePath, {
            baseUrl: baseUrl,
            security: [
                requirement,
            ]
        })



        it('bearer', async () => {


            await givenExistingSettings({
                'bearerAuth': {
                    type: 'http',
                    scheme: 'bearer',
                    tokenVariable: 'mytoken'
                }
            })

            await applySourceChanges(
                [
                    {
                        source,
                        changes: [],
                        remoteDoc: {
                            openapi: '3.0.0',
                            info: { title: 'Test API', version: '1.0.0' },
                            paths: {},
                            security: [{ bearerAuth: [] }],
                            components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
                        }
                    }
                ],
            )

            const updatedSettings = await readFolderSettings(source.absolutePath)

            expect(updatedSettings).toStrictEqual({
                baseUrl: baseUrl,
                security: [
                    {
                        'bearerAuth': {
                            type: 'http',
                            scheme: 'bearer',
                            tokenVariable: 'mytoken'
                        }
                    }
                ]
            })

        })

        it('basic', async () => {


            await givenExistingSettings({
                'basicAuth': {
                    type: 'http',
                    scheme: 'basic',
                    passwordVariable: 'mypassword',
                    usernameVariable: 'myusername'
                }
            })

            await applySourceChanges(
                [
                    {
                        source,
                        changes: [],
                        remoteDoc: {
                            openapi: '3.0.0',
                            info: { title: 'Test API', version: '1.0.0' },
                            paths: {},
                            security: [{ basicAuth: [] }],
                            components: { securitySchemes: { basicAuth: { type: 'http', scheme: 'basic' } } },
                        }
                    }
                ],
            )


            const updatedSettings = await readFolderSettings(source.absolutePath)

            expect(updatedSettings).toStrictEqual({
                baseUrl: baseUrl,
                security: [
                    {
                        'basicAuth': {
                            type: 'http',
                            scheme: 'basic',
                            passwordVariable: 'mypassword',
                            usernameVariable: 'myusername'
                        }
                    }
                ]
            })

        })

        it('apiKey, in and name are taken from new security, keyVariable is preserved', async () => {


            await givenExistingSettings({
                'apiKey': {
                    type: 'apiKey',
                    name: 'X-API-KEY',
                    in: 'header',
                    keyVariable: 'mypassword'
                }
            })

            await applySourceChanges(
                [
                    {
                        source,
                        changes: [],
                        remoteDoc: {
                            openapi: '3.0.0',
                            info: { title: 'Test API', version: '1.0.0' },
                            paths: {},
                            security: [{ apiKey: [] }],
                            components: { securitySchemes: { apiKey: { type: 'apiKey', in: 'query', name: 'X-API-KEY-NEW' } } },
                        }
                    }
                ],
            )


            const updatedSettings = await readFolderSettings(source.absolutePath)

            expect(updatedSettings).toStrictEqual({
                baseUrl: baseUrl,
                security: [
                    {
                        'apiKey': {
                            type: 'apiKey',
                            name: 'X-API-KEY-NEW',
                            in: 'query',
                            keyVariable: 'mypassword'
                        }
                    }
                ]
            })

        })


        it('given different type than the existing method, everything is replaced', async () => {


            await givenExistingSettings({
                'bearerAuth': {
                    type: 'http',
                    scheme: 'bearer',
                    tokenVariable: 'mytoken'
                }
            })

            await applySourceChanges(
                [
                    {
                        source,
                        changes: [],
                        remoteDoc: {
                            openapi: '3.0.0',
                            info: { title: 'Test API', version: '1.0.0' },
                            paths: {},
                            security: [{ bearerAuth: [] }],
                            components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'basic' } } },
                        }
                    }
                ],
            )

            const updatedSettings = await readFolderSettings(source.absolutePath)

            expect(updatedSettings).toStrictEqual({
                baseUrl: baseUrl,
                security: [
                    {
                        'bearerAuth': {
                            type: 'http',
                            scheme: 'basic',
                            passwordVariable: 'BEARERAUTH_PASSWORD',
                            usernameVariable: 'BEARERAUTH_USERNAME'
                        }
                    }
                ]
            })

        })


    })

})