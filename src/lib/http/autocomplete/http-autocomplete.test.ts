import { describe, expect, it, test } from "vitest"
import { computeHttpCompletions, functionCompletions, headerCompletions, methods, pathCompletion } from "./http-autocomplete"

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