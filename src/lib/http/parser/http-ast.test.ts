import { describe, expect, it, test } from "vitest";
import { computeHttpAst, Expression, FormBodyNode, HttpErrorMessage, HttpRequestAst, JsonBodyNode, RequestFunction, TextBodyNode } from "./http-ast";

const whitespaces = [' ', '  ', '   ', '\t', ' \t\t']
const newlines = ['\n', '\n\n', '\n\n\n']

const functions = [
    ['basic(username, <password>, date())', 'function(basic, username, variable(<password>), function(date))']
]

type Varient = [string, string]

const skippedVarients: Varient[] = [[' ', 'space'], ['   ', 'multiple spaces'], ['\t', 'tab'], ['\n', 'newline'], ['\n\n\n', 'multiple newlines'], ['// this is a comment\n', 'comment']]

describe("request line", () => {

    test("method /", () => {
        const httpRequest = `GET /`
        const expected = expectation("GET", ["/"])

        assert(httpRequest, expected);

    })

    test("method url", () => {
        const httpRequest = `GET /this/is/a/test`
        const expected = expectation("GET", ["/this/is/a/test"]);

        assert(httpRequest, expected);

    })

    test("method variable", () => {
        const httpRequest = `GET <api>`
        const expected = expectation("GET", ['variable(<api>)']);

        assert(httpRequest, expected);

    })

    test("method variable + path", () => {
        const httpRequest = `GET <api>/users<userid>`
        const expected = expectation("GET", ['variable(<api>)', '/users', 'variable(<userid>)'])

        assert(httpRequest, expected);

    })

    test("method whitespace url", () => {
        const httpRequest = `GET   /this/is/a/test`
        const expected = expectation("GET", ["/this/is/a/test"]);

        assert(httpRequest, expected);

    })


    describe('(varient) method /', () => {

        for (const [addIn, description] of skippedVarients) {
            test(`${description}`, () => {
                const httpRequest = `${addIn}GET /`
                const expected = expectation("GET", ["/"]);

                assert(httpRequest, expected);
            })
        }

    })

})


describe("headers", () => {

    const requestLine = (rest: string) => `GET /\n// this is a comment\n${rest}`

    test("key : literal", () => {

        const httpRequest = `GET /\nContent-Type: application/json`
        const expected = expectation("GET", ["/"], [["Content-Type", "application/json"]]);

        assert(httpRequest, expected);
    })

    test("key : variable", () => {

        const httpRequest = `GET /\nContent-Type: <content_type>`
        const expected = expectation("GET", ["/"], [["Content-Type", "variable(<content_type>)"]]);

        assert(httpRequest, expected);
    })

    test("key : function", () => {

        const httpRequest = `GET /\nContent-Type: time()`
        const expected = expectation("GET", ["/"], [["Content-Type", "function(time)"]]);

        assert(httpRequest, expected);
    })

    test("key : function(literal, variable, function())", () => {
        const httpRequest = `GET /\nContent-Type: basic(username, <password>, date())`
        const expected = expectation("GET", ["/"], [["Content-Type", "function(basic, username, variable(<password>), function(date))"]]);

        assert(httpRequest, expected);
    })

    it('key value are trimmed on both sides', () => {
        for (const whitespace of whitespaces) {
            const httpRequest = requestLine(`${whitespace}Content-Type${whitespace}:${whitespace}application/json${whitespace}`)
            const expected = expectation("GET", ["/"], [["Content-Type", `application/json`]]);
            assert(httpRequest, expected);
        }
    })

    test("space in key or value are kept", () => {
        const spaces = [' ', '\t']
        for (const whitespace of spaces) {
            const httpRequest = requestLine(`Content${whitespace}Type: application${whitespace}/json`)
            const expected = expectation("GET", ["/"], [[`Content${whitespace}Type`, `application${whitespace}/json`]]);

            assert(httpRequest, expected);
        }
    })
})


describe("body", () => {

    const body = (rest: string) => `GET /\n// this is a comment\n@body\n${rest}`

    it('@body null', () => {

        const httpRequest = body(``)
        assert(httpRequest, expectation("GET", ["/"], [], null));

    })


    it('json', () => {

        const jsonBodies = ['{sdf', '[sdf']

        for (const jsonBody of jsonBodies) {
            
            const httpRequest = body(jsonBody)
            const expected = expectation("GET", ["/"], [], `json(${jsonBody})`);

            assert(httpRequest, expected);
        }

    })


    describe('form', () => {

        const pair = (key: string, value: string, pad: string = '') => `${pad}${key}${pad}=${pad}${value}${pad}`

        it('key=value pairs', () => {

            const httpRequest = body(`${pair('key', 'value')}\n${pair('key', 'val')}`)
            const expected = expectation("GET", ["/"], [], "form(key=value,key=val)");

            assert(httpRequest, expected);

        })

        it('key = variable', () => {

            const httpRequest = body(pair('key', '<value>'))
            const expected = expectation("GET", ["/"], [], "form(key=variable(<value>))");

            assert(httpRequest, expected);

        })

        for (const [template, fxExpected] of functions) {
            it(`key = ${fxExpected}`, () => {

                const httpRequest = body(pair('key', template))
                const expected = expectation("GET", ["/"], [], `form(key=${fxExpected})`);

                assert(httpRequest, expected);

            })
        }

        it('trims spaces before and after key value', () => {

            for (const whitespace of [...whitespaces]) {

                const httpRequest = body(pair('key', 'value', whitespace))
                const expected = expectation("GET", ["/"], [], "form(key=value)");

                assert(httpRequest, expected);
            }

        })

    })

    it('text', () => {

        const httpRequest = body(`this is a text`)
        const expected = expectation("GET", ["/"], [], "text(this is a text)");

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })

    it('trimmed on both sides', () => {

        const varients = ['{}', '[]', 'key=value']

        for (const bodyVariant of varients) {
            for (const whitespace of [...whitespaces, ...newlines]) {
                const httpRequest = body(`${whitespace}${bodyVariant}${whitespace}`)

                const httpRequestAst = computeHttpAst(httpRequest);

                expect(httpRequest.slice(httpRequestAst.body?.from, httpRequestAst.body?.to)).toEqual(bodyVariant);
            }
        }

    })

})


describe("errors", () => {

    it('missing url', () => {
        for (const whitespace of ['', ...newlines, ...whitespaces]) {
            const httpRequest = `GET${whitespace}`
            const expected = expectation("GET", [], [], null, [HttpErrorMessage.MissingUrl]);

            assert(httpRequest, expected);
        }
    })

    it('wrong url -> ! ( / http https <variable> )', () => {
        const httpRequest = `GET htp://getpostchi.com`
        const expected = expectation("GET", ['htp://getpostchi.com'], [], null, [HttpErrorMessage.WrongUrlProtocol]);

        assert(httpRequest, expected);
    })

    it("missing value -> key :? space?", () => {

        for (const addIn of ['', ':', ': ', ' : \n', '\n', ...whitespaces]) {
            const httpRequest = `GET /\nuser-agent${addIn}`
            const expected: Expectation = expectation("GET", ["/"], [['user-agent', '']], null, [HttpErrorMessage.MissingValue]);

            assert(httpRequest, expected);
        }
    })

    it("missing key -> space? : space? value", () => {

        for (const addIn of ['', ...whitespaces]) {
            const httpRequest = `GET /\n${addIn}:${addIn}postchi/1.0`
            const expected: Expectation = expectation("GET", ["/"], [['', 'postchi/1.0']], null, [HttpErrorMessage.MissingKey]);

            assert(httpRequest, expected);
        }
    })

})


function assert(request: string, expected: Expectation) {
    const httpRequestAst = computeHttpAst(request);
    expect(valuesOf(httpRequestAst, request), request).toEqual(expected);
}


function expectation(method: string, url: string[] = [], headers: [string, string][] = [], body: string | null = null, errors: HttpErrorMessage[] = []): Expectation {
    return {
        method: method,
        url: url,
        headers: headers.map(([k, v]) => ({ key: k, value: v })),
        body: body,
        errors: errors.join(",")
    }
}


function valuesOf(ast: HttpRequestAst, request: string): Expectation {
    const value = (node: { type: string; from: number, to: number }) => {
        if (node.type === "variable") {
            return `variable(${request.slice(node.from, node.to)})`
        } else if (node.type === "function") {
            return expressionString(node as RequestFunction, request);
        }
        return request.slice(node.from, node.to);
    };

    const bodyValue = (body: JsonBodyNode | FormBodyNode | TextBodyNode | null) => {
        if (!body) return null;
        if (body.type === "json") return `json(${value(body)})`;
        if (body.type === "text") return `text(${value(body)})`;
        return `form(${body.entries.map(({ key, value }) => `${key}=${expressionString(value, request)}`).join(",")})`;
    }

    return {
        method: value(ast.method),
        url: ast.url.map(u => value(u)),
        headers: ast.headers.map(({ key, value: v }) => ({ key: value(key), value: value(v) })),
        body: bodyValue(ast.body),
        errors: ast.errors.map(e => (e.message)).join(",")
    }
}

// turn expression node to string, for testing purposes
// e.g. basic(time(), username, <password>) -> function(basic, function(time), username, variable(<password>))
function expressionString(node: Expression, request: string): string {
    function exprToString(expr: Expression): string {
        const text = request.slice(expr.from, expr.to);

        if (expr.type === "literal") {
            return text;
        }

        if (expr.type === "variable") {
            return `variable(${text})`;
        }

        // Function
        const name = request.slice(expr.name.from, expr.name.to);
        const args = expr.args.map(exprToString);
        return `function(${[name, ...args].join(", ")})`;
    }

    return exprToString(node);
}


type Expectation = { method: string; url: string[]; headers: { key: string, value: string }[]; body: string | null; errors: string };