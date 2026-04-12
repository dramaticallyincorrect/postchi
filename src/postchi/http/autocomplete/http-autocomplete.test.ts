import { describe, expect, it, test } from "vitest"
import { bodySnippet, computeHttpCompletions, contentTypeCompletions, functionCompletions, allHeaderCompletions, methods, pathCompletion, variableCompletions, SPEC_SECTION } from "./http-autocomplete"
import { OpenAPIV3 } from "openapi-types"

const vars = [
    { key: 'var1', value: 'value1' },
    { key: 'var2', value: 'value2' },
]

test('method', async () => {

    const httpRequest = `P /`

    const result = await computeHttpCompletions(0, httpRequest, () => 1)

    expect(result).toEqual({
        from: 0,
        options: [
            ...methods
        ]
    })

})

describe('variable', () => {
    it('url', async () => {
        const httpRequest = `GET /<`
        const result = await computeHttpCompletions(httpRequest.indexOf('<') + 1, httpRequest, () => 2, vars)

        expect(result).toEqual({
            from: httpRequest.indexOf('<'),
            options: [
                ...variableCompletions(vars)
            ]
        })
    })

    it('header value', async () => {
        const httpRequest = `GET /\nuseragent: <`
        const result = await computeHttpCompletions(httpRequest.indexOf('<'), httpRequest, () => 2, vars)

        expect(result).toEqual({
            from: httpRequest.indexOf('<'),
            options: [
                ...variableCompletions(vars)
            ]
        })
    })


    it('form body', async () => {
        const httpRequest = `GET /\n@body\n password= <`
        const result = await computeHttpCompletions(httpRequest.indexOf('<'), httpRequest, () => 2, vars)

        expect(result).toEqual({
            from: httpRequest.indexOf('<'),
            options: [
                ...variableCompletions(vars)
            ]
        })
    })

    it('json body', async () => {
        const httpRequest = `GET /\n@body\n {"password": "<"}`
        const result = await computeHttpCompletions(httpRequest.indexOf('<'), httpRequest, () => 2, vars)

        expect(result).toEqual({
            from: httpRequest.indexOf('<'),
            options: variableCompletions(vars)
        })
    })
})

describe('function expressions provide variables and functions', () => {

    describe('single function', () => {
        testFunction('bearer()')
    })

    describe('nested function', async () => {
        testFunction('bearer(join())')
    })

    const testFunction = (fn: string) => {
        const testFn = (testName: string, prefix: string, fn: string) => {
            it(testName, async () => {
                const httpRequest = `${prefix}${fn}`

                const result = await computeHttpCompletions(httpRequest.indexOf(')'), httpRequest, () => 3, vars)

                expect(result).toEqual({
                    from: httpRequest.indexOf(')'),
                    options: [variableCompletions(vars), functionCompletions].flat()
                })
            })
        }

        testFn('header value', 'GET /\nuseragent: ', fn)
        testFn('form body', 'GET /\n@body\nusername= ', fn)
    }

})


describe('header', () => {
    // it('empty line', async () => {
    //     const httpRequest = `GET /\n\n`

    //     const result = await computeHttpCompletions(httpRequest.length - 1, httpRequest, () => 2)

    //     expect(result).toEqual({
    //         from: httpRequest.length - 1,
    //         options: [
    //             bodySnippet,
    //             ...headerCompletions
    //         ]
    //     })
    // }, )

    it('key', async () => {
        const httpRequest = `GET /\na`

        const result = await computeHttpCompletions(httpRequest.length - 1, httpRequest, () => 2)

        expect(result).toEqual({
            from: httpRequest.length - 1,
            options: [
                bodySnippet,
                ...allHeaderCompletions
            ]
        })
    })

    it('value', async () => {
        const httpRequest = `GET /\naccept:`

        const result = await computeHttpCompletions(httpRequest.length, httpRequest, () => 2)

        expect(result).toEqual({
            from: httpRequest.length,
            options: [
                ...functionCompletions
            ]
        })
    })

    it('content types', async () => {
        const httpRequest = `GET /\nContent-Type:`

        const result = await computeHttpCompletions(httpRequest.length, httpRequest, () => 2)

        expect(result).toEqual({
            from: httpRequest.length,
            options: [
                ...contentTypeCompletions, ...functionCompletions
            ]
        })
    })

})

describe('body', () => {
    describe('form', () => {
        it('key has no completions', async () => {
            const httpRequest = `GET /\n@body\nusername=`

            const result = await computeHttpCompletions(httpRequest.length - 4, httpRequest, () => 3)

            expect(result).toEqual({
                from: 0,
                options: []
            })
        })

        it('value', async () => {
            const httpRequest = `GET /\n@body\nusername=`

            const result = await computeHttpCompletions(httpRequest.length, httpRequest, () => 3)

            expect(result).toEqual({
                from: httpRequest.length,
                options: [
                    ...functionCompletions
                ]
            })
        })

        it('read text function provides path completions', async () => {
            const httpRequest = `GET /\n@body\nusername= readText()`

            const result = await computeHttpCompletions(httpRequest.length - 1, httpRequest, () => 3)

            expect(result).toEqual({
                from: httpRequest.length - 1,
                options: await pathCompletion('/')
            })
        })

        it('read text function provides path completions', async () => {
            const httpRequest = `GET /\n@body\nusername= readText(/colle)`

            const result = await computeHttpCompletions(httpRequest.length - 1, httpRequest, () => 3)

            expect(result).toEqual({
                from: httpRequest.indexOf('/colle'),
                options: await pathCompletion('/colle')
            })
        })
    })
})


describe('with spec', () => {

    it('provides spec query parameter enums', async () => {

        const spec: OpenAPIV3.OperationObject = {
            parameters: [
                {
                    name: 'status',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['active', 'inactive', 'pending']
                    }
                }
            ],
            responses: {}
        }


        const httpRequest = `GET /?status=`
        const result = await computeHttpCompletions(httpRequest.indexOf('='), httpRequest, () => 2, vars, spec)

        expect(result).toEqual({
            from: httpRequest.indexOf('=') + 1,
            options: [
                { label: 'active', type: 'enum' },
                { label: 'inactive', type: 'enum' },
                { label: 'pending', type: 'enum' }
            ]
        })

    })

    it('header names', async () => {

        const spec: OpenAPIV3.OperationObject = {
            parameters: [
                {
                    name: 'x-status',
                    in: 'header',
                },
                {
                    name: 'x-header',
                    in: 'header',
                }
            ],
            responses: {}
        }


        const httpRequest = `GET /\nx`
        const result = await computeHttpCompletions(httpRequest.indexOf('x'), httpRequest, () => 2, vars, spec)

        expect(result.from).toBe(httpRequest.indexOf('x'))
        expect(result.options).containSubset([
            { label: 'x-status', type: 'enum', section: SPEC_SECTION },
            { label: 'x-header', type: 'enum', section: SPEC_SECTION },
        ])

    })


    it('header value enums', async () => {

        const spec: OpenAPIV3.OperationObject = {
            parameters: [
                {
                    name: 'x-status',
                    in: 'header',
                    schema: {
                        type: 'string',
                        enum: ['active', 'inactive', 'pending']
                    }
                },
                {
                    name: 'x-header',
                    in: 'header',
                }
            ],
            responses: {}
        }


        const httpRequest = `GET /\nx-status:`
        const result = await computeHttpCompletions(httpRequest.length, httpRequest, () => 2, vars, spec)

        expect(result.from).toBe(httpRequest.length)
        expect(result.options).containSubset([
            { label: 'active', type: 'enum', section: SPEC_SECTION, },
            { label: 'inactive', type: 'enum', section: SPEC_SECTION },
            { label: 'pending', type: 'enum', section: SPEC_SECTION }
        ])

    })


    describe('body', () => {
        describe('json', () => {
            it('all fields names are provided', async () => {

                const spec: OpenAPIV3.OperationObject = {
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    "type": "object",
                                    "properties": {
                                        "status": { "type": "string", "enum": ["active", "inactive"] },
                                        "name": { "type": "string" },
                                        "age": { "type": "integer" }
                                    }
                                },
                            }
                        }
                    },
                    parameters: [],
                    responses: {}
                }


                const httpRequest = `GET /\n@body\n{"status": ""}`
                const result = await computeHttpCompletions(httpRequest.indexOf('status'), httpRequest, () => 2, vars, spec)

                expect(result).toEqual({
                    from: httpRequest.indexOf('status'),
                    options: [
                        { label: 'status', type: 'property' },
                        { label: 'name', type: 'property' },
                        { label: 'age', type: 'property' },
                    ]
                })
            })

            it('enum for field value', async () => {

                const spec: OpenAPIV3.OperationObject = {
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    "type": "object",
                                    "properties": {
                                        "status": { "type": "string", "enum": ["active", "inactive"] },
                                        "name": { "type": "string" },
                                        "age": { "type": "integer" }
                                    }
                                },
                            }
                        }
                    },
                    responses: {}
                }


                const httpRequest = `GET /\n@body\n{"status": ""}`
                const result = await computeHttpCompletions(httpRequest.indexOf('""') + 1, httpRequest, () => 2, vars, spec)
                expect(result).toStrictEqual({
                    from: httpRequest.indexOf('""') + 1,
                    options: [
                        {
                            label: 'active', type: 'enum', section: SPEC_SECTION
                        },
                        {
                            label: 'inactive', type: 'enum', section: SPEC_SECTION
                        },
                        ...variableCompletions(vars)
                    ]
                })
            })
        })
    })

})