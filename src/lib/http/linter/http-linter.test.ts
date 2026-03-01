import { describe, expect, it, test } from 'vitest';
import { computeHttpDiagnostics, errorDiagnostic } from './http-linter';
import { HttpErrorMessage } from '../parser/http-ast';



test('warning non standard method', () => {

    const input = `/api/v1/data`

    // const tree = parser.parse(input)

    // const diagnostics = computeHttpDiagnostics(tree, input)

    // // sanity check!
    // expect(computeHttpDiagnostics(parser.parse(`POST /`), `POST /`)).toStrictEqual([])

    // expect(diagnostics).toStrictEqual([
    //     errorDiagnostic(HttpErrorMessage.MissingMethod, 0, 0)
    // ])

})

test('Missing path', () => {

    const input = `GET`

    const diagnostics = computeHttpDiagnostics(input)

    expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingUrl, input.length, input.length)])

})

test('Header name missing', () => {

    const input = `
GET /
: Postchi/1.0`.trim()

    const diagnostics = computeHttpDiagnostics(input)

    const index = input.indexOf(":")
    expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingKey, index, index)])

})

test('Header value missing', () => {

    const input = `GET /
    useragent: `

    const diagnostics = computeHttpDiagnostics(input)

    expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingValue, input.length, input.length)])

})

describe('variables', () => {

    const undefined = '<undefined>'
    const malformed = '<undefined'

    const environment = {
        name: "env",
        variables: [
            {
                key: "var",
                value: "value"
            }
        ]
    }

    function testMalformed(input: string) {
        const diagnostics = computeHttpDiagnostics(input, environment)

        const index = input.indexOf(malformed)
        expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MalformedVariable, index, index + malformed.length)])
    }

    function testUndefined(input: string) {

        const diagnostics = computeHttpDiagnostics(input, environment)

        const index = input.indexOf(undefined)
        expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.VariableNotDefined, index, index + undefined.length)])
    }

    describe('url', () => {
        it('malformed variable', () => {
            const input = 'GET /<undefined'

            testMalformed(input)
        })

        it('undefined variable', () => {

            const input = 'GET /<undefined>'

            testUndefined(input)

        })
    })

    describe('headers', () => {
        it('malformed variable', () => {
            const input = 'GET / \n useragent: <undefined'
            testMalformed(input)
        })

        it('undefined variable', () => {

            const input = 'GET / \n useragent: <undefined>'

            testUndefined(input)

        })
    })

})





test('correct request has no errors', () => {

    const input = [
        `GET /
    useragent: Postchi/1.0
    
    `,
        `GET /
    useragent: Postchi/1.0
    content-type: application/json
    `,

        `GET /
    useragent: Postchi/1.0
    content-type: basic()
    `,
        `GET /
    useragent: Postchi/1.0
    content-type: <<var>>
    `,
        `GET /
    useragent: Postchi/1.0
    content-type: application/json
    
    `,
        `GET /
    useragent: Postchi/1.0
    content-type: application/json

    @body
    `
    ]

    input.forEach(req => {
        const diagnostics = computeHttpDiagnostics(req, {
            name: "env",
            variables: [
                {
                    key: "var",
                    value: "value"
                }
            ]
        })
        expect(diagnostics).toStrictEqual([])
    })

})