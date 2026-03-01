import { describe, expect, it, test } from "vitest"
import { computeHttpCompletions, functionCompletions, headerCompletions, methods, pathCompletion, variableCompletions } from "./http-autocomplete"

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
    it('empty line', async () => {
        const httpRequest = `GET /\n\n`

        const result = await computeHttpCompletions(httpRequest.length - 1, httpRequest, () => 2)

        expect(result).toEqual({
            from: httpRequest.length - 1,
            options: [
                ...headerCompletions
            ]
        })
    })

    it('key', async () => {
        const httpRequest = `GET /\na`

        const result = await computeHttpCompletions(httpRequest.length - 1, httpRequest, () => 2)

        expect(result).toEqual({
            from: httpRequest.length - 1,
            options: [
                ...headerCompletions
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