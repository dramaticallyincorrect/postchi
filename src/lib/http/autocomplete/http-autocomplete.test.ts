import { describe, expect, it, test } from "vitest"
import { computeHttpCompletions, functionCompletions, headerCompletions } from "./http-autocomplete"


test('method', () => {

    const httpRequest = `P /`

    const result = computeHttpCompletions(0, httpRequest)

    expect(result).toEqual({
        from: 0,
        options: [
            { label: 'GET', type: "keyword" },
            { label: 'POST', type: "keyword" },
            { label: 'PUT', type: "keyword" },
            { label: 'DELETE', type: "keyword" },
            { label: 'PATCH', type: "keyword" },
            { label: 'HEAD', type: "keyword" },
            { label: 'OPTIONS', type: "keyword" },
        ]
    })

})


describe('header', () => {
    it('empty line', () => {
        const httpRequest = `GET /\n\n`

        const result = computeHttpCompletions(httpRequest.length - 1, httpRequest)

        expect(result).toEqual({
            from: httpRequest.length - 1,
            options: [
                ...headerCompletions
            ]
        })
    })

    it('key', () => {
        const httpRequest = `GET /\na`

        const result = computeHttpCompletions(httpRequest.length - 1, httpRequest)

        expect(result).toEqual({
            from: httpRequest.length - 1,
            options: [
                ...headerCompletions
            ]
        })
    })

    it('value', () => {
        const httpRequest = `GET /\naccept:`

        const result = computeHttpCompletions(httpRequest.length, httpRequest)

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
        it('value', () => {
            const httpRequest = `GET /\n@body\nusername=`

            const result = computeHttpCompletions(httpRequest.length, httpRequest)

            expect(result).toEqual({
                from: httpRequest.length,
                options: [
                    ...functionCompletions
                ]
            })
        })
    })
})