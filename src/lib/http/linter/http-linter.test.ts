import { expect, test } from 'vitest';
import { parser } from '../parser/parser';
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

    const tree = parser.parse(input)

    const diagnostics = computeHttpDiagnostics(tree, input)

    expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingUrl, input.length, input.length)])

})

test('Missing path', () => {

    const input = `GET`

    const tree = parser.parse(input)

    const diagnostics = computeHttpDiagnostics(tree, input)

    expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingUrl, input.length, input.length)])

})

test('Header name missing', () => {

    const input = `
GET /
: Postchi/1.0`.trim()

    const tree = parser.parse(input)

    const diagnostics = computeHttpDiagnostics(tree, input)

    const index = input.indexOf(":")
    expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingKey, index, index)])

})

test('Header value missing', () => {

    const input = `GET /
    useragent: `

    const tree = parser.parse(input)

    const diagnostics = computeHttpDiagnostics(tree, input)

    expect(diagnostics).toStrictEqual([errorDiagnostic(HttpErrorMessage.MissingValue, input.length, input.length)])

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
        const tree = parser.parse(req)
        const diagnostics = computeHttpDiagnostics(tree, req)
        expect(diagnostics).toStrictEqual([])
    })

})