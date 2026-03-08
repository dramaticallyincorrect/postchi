import { describe, expect, it } from 'vitest';
import { computeHttpDiagnostics, errorDiagnostic, HttpErrorMessage } from './http-linter';
import { endOf, whitespaces } from '@/lib/utils/test-utils';
import { Diagnostic } from '@codemirror/lint';


function allFunctions(describeLabel: string, fn: string, error: HttpErrorMessage) {
    const functions = [
        { label: `header`, request: `GET / \nContent-Type: ${fn}` },
        { label: `form body`, request: `GET / \n@body\nkey=${fn}` },
        { label: `nested`, request: `GET / \n@body\nkey=join(1234, ${fn})` }
    ]

    describe(describeLabel, () => {
        functions.forEach(({ label, request }) => {
            it(label, () => {
                expectError(request, errorDiagnostic(error, request.indexOf(fn), request.indexOf(fn) + fn.length))
            })
        })
    })
}

function expectError(input: string, error: Diagnostic) {
    const diagnostics = computeHttpDiagnostics(input)
    expect(diagnostics, input).toStrictEqual([error])
}

describe('http lints', () => {
    it('warning non standard method', () => {

        // const input = `/api/v1/data`

        // const tree = parser.parse(input)

        // const diagnostics = computeHttpDiagnostics(tree, input)

        // // sanity check!
        // expect(computeHttpDiagnostics(parser.parse(`POST /`), `POST /`)).toStrictEqual([])

        // expect(diagnostics).toStrictEqual([
        //     errorDiagnostic(HttpErrorMessage.MissingMethod, 0, 0)
        // ])

    })

    describe('Missing path', () => {

        it('when only method should start from end position', () => {
            const input = 'GET'
            const index = 3
            expectError(input, errorDiagnostic(HttpErrorMessage.MissingUrl, index, index))
        })

        it('when white space should start 1 after method', () => {
            const input = 'GET '
            const index = 4
            expectError(input, errorDiagnostic(HttpErrorMessage.MissingUrl, index, index))
        })
    })

    it('absolute path should be http', () => {

        const input = `GET wrong/path`

        expectError(input, errorDiagnostic(HttpErrorMessage.WrongUrlProtocol, 4, 4))

    })

    describe('missing header name', () => {
        for (const addIn of ['', ...whitespaces]) {
            const label = `addIn: '${addIn.replace('\n', '\\n').replace('\t', '\\t')}'`
            it(label, () => {
                const input = `GET /\n${addIn}:${addIn}postchi/1.0`

                const index = input.indexOf(':')
                expectError(input, errorDiagnostic(HttpErrorMessage.MissingKey, index, index))
            })
        }
    })

    describe('missing header value', () => {
        for (const addIn of ['', ':', ': ', ' : \n', '\n', ...whitespaces]) {
            const label = `addIn: '${addIn.replace('\n', '\\n').replace('\t', '\\t')}'`
            it(label, () => {
                const input = `GET /
    useragent${addIn}`

                const diagnostics = computeHttpDiagnostics(input)
                const index = input.indexOf("useragent") + "useragent".length + (addIn.replace('\n', '').length)

                expect(diagnostics, input).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingValue, index, index)])
            })
        }
    })

    describe('functions', () => {
        allFunctions("unrecognized function", "unknownFunction()", HttpErrorMessage.UnrecognizedFunction)

        allFunctions("missing function parameters", "basicAuth()", HttpErrorMessage.MissingParameters)

        allFunctions("too many parameters", "basicAuth(a,b,c)", HttpErrorMessage.ExtraParameters)
    })

    describe('variables', () => {

        function allVariables(describeLabel: string, variable: string, error: HttpErrorMessage) {
            const functions = [
                { label: `url`, request: `GET /${variable}` },
                { label: `header`, request: `GET / \nContent-Type: ${variable}` },
                { label: `form body`, request: `GET / \n@body\nkey=${variable}` },
                { label: `nested`, request: `GET / \n@body\nkey=join(1234, ${variable})` }
            ]

            describe(describeLabel, () => {
                functions.forEach(({ label, request }) => {
                    it(label, () => {
                        expectError(request, errorDiagnostic(error, request.indexOf(variable), endOf(request, variable)))
                    })
                })
            })
        }

        allVariables("malformed variable", '<malformed', HttpErrorMessage.MalformedVariable)

        allVariables("undefined variable", '<undefined>', HttpErrorMessage.VariableNotDefined)

    })

    describe('body', () => {
        describe('form', () => {

            it('url encoded content type cannot have files attached to it', () => {
                const input = `GET http://getpostchi.com\nContent-Type: application/x-www-form-urlencoded\n@body\nkey=readFile(/)`

                const diagnostics = computeHttpDiagnostics(input)
                const index = input.indexOf("readFile(/)")
                expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.UrlEncodedWithAttachedFile, index, index + "readFile(/)".length)])
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
    content-type: bearer(1234)
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
