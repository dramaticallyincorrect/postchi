import { describe, expect, it } from 'vitest';
import { computeHttpDiagnostics, errorDiagnostic, HttpErrorMessage } from './http-linter';
import { newlines, whitespaces } from '@/lib/utils/test-utils';


describe('http lints', () => {
    it('warning non standard method', () => {

        const input = `/api/v1/data`

        // const tree = parser.parse(input)

        // const diagnostics = computeHttpDiagnostics(tree, input)

        // // sanity check!
        // expect(computeHttpDiagnostics(parser.parse(`POST /`), `POST /`)).toStrictEqual([])

        // expect(diagnostics).toStrictEqual([
        //     errorDiagnostic(HttpErrorMessage.MissingMethod, 0, 0)
        // ])

    })

    it('Missing path', () => {

        for (const whitespace of ['', ...newlines, ...whitespaces]) {
            const input = `${whitespace}GET${whitespace}`

            const diagnostics = computeHttpDiagnostics(input)
            const index = input.indexOf("GET") + "GET".length + (whitespace ? 1 : 0)
            expect(diagnostics, input).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingUrl, index, index)])
        }

    })

    it('path should be relative or http', () => {

        const input = `GET wrong/path`

        const diagnostics = computeHttpDiagnostics(input)

        expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.WrongUrlProtocol, input.indexOf("wrong/path"), input.indexOf("wrong/path"))])

    })

    for (const addIn of ['', ...whitespaces]) {
        it(`Header name missing with addIn: "${addIn}"`, () => {
            const input = `GET /\n${addIn}:${addIn}postchi/1.0`


            const diagnostics = computeHttpDiagnostics(input)

            const index = input.indexOf(":")
            expect(diagnostics, input).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingKey, index, index)])
        })

        // const expected: Expectation = expectation("GET", ["/"], [['', 'postchi/1.0']], null, [HttpErrorMessage.MissingKey]);

        // assert(httpRequest, expected);
    }

    for (const addIn of ['', ':', ': ', ' : \n', '\n', ...whitespaces]) {
        it(`Header value missing with addIn: "${addIn}"`, () => {
            const input = `GET /
    useragent${addIn}`

            const diagnostics = computeHttpDiagnostics(input)
            const index = input.indexOf("useragent") + "useragent".length + (addIn.replace('\n', '').length)

            expect(diagnostics, input).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingValue, index, index)])
        })
    }

    describe('variables', () => {

        const undefined = '<undefined>'
        const malformed = '<undefined'

        const variables = [
            {
                key: "var",
                value: "value"
            }
        ]

        function testMalformed(input: string) {
            const diagnostics = computeHttpDiagnostics(input, variables)

            const index = input.indexOf(malformed)
            expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MalformedVariable, index, index + malformed.length)])
        }

        function testUndefined(input: string) {

            const diagnostics = computeHttpDiagnostics(input, variables)

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

    describe('body', () => {
        describe('form', () => {
            it('url encoded content type cannot have files attached to it', () => {
                const input = `GET http://getpostchi.com\nContent-Type: application/x-www-form-urlencoded\n@body\nkey=readFile()`

                const diagnostics = computeHttpDiagnostics(input)
                const index = input.indexOf("readFile()")
                expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.UrlEncodedWithAttachedFile, index, index + "readFile()".length)])
            })
        })
    })




    it('correct request has no errors', () => {

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
            const diagnostics = computeHttpDiagnostics(req, [
                {
                    key: "var",
                    value: "value"
                }
            ])
            expect(diagnostics).toStrictEqual([])
        })

    })
})