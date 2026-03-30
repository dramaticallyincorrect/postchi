import { describe, expect, it, test } from "vitest";
import { computeHttpAst, Expression, FormBodyNode, HttpNode, HttpRequestAst, JsonBodyNode, RequestFunction, TextBodyNode } from "./http-ast";
import { newlines, whitespaces } from "@/lib/utils/test-utils";

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

    it('explicit content type overrides infered content type', () => {
        const httpRequest = `GET /\nContent-Type: multipart/form-data\n@body\n{}`
        const expected = expectation("GET", ["/"], [["Content-Type", "multipart/form-data"]], "multipart({}=)");
        assert(httpRequest, expected);
    })


    describe('json', () => {


        it('only literals', () => {
            const jsonBodies = ['{', '[']

            for (const jsonBody of jsonBodies) {

                const httpRequest = body(jsonBody)
                const expected = expectation("GET", ["/"], [], `json(${jsonBody})`);

                assert(httpRequest, expected);
            }
        })

        it('variables in values', () => {
            const jsonBody = `{ "key": "<value>" }`
            const httpRequest = body(jsonBody)
            const expected = expectation("GET", ["/"], [], `json({"key":json-value(variable(<value>))})`);

            assert(httpRequest, expected);
        })

    })


    describe('form', () => {

        const pair = (key: string, value: string, pad: string = '') => `${pad}${key}${pad}=${pad}${value}${pad}`

        it('literal values are treated as urlencoded', () => {

            const httpRequest = body(`${pair('key', 'value')}\n${pair('key', 'val')}`)
            const expected = expectation("GET", ["/"], [], "urlencoded(key=value,key=val)");

            assert(httpRequest, expected);

        })

        it('read file as value is considered multipart', () => {

            const httpRequest = body(`${pair('key', 'value')}\n${pair('key', 'readfile()')}`)
            const expected = expectation("GET", ["/"], [], "multipart(key=value,key=function(readfile))");

            assert(httpRequest, expected);

        })

        it('explicit form content type sets form type to multipart even without any files attached', () => {

            const httpRequest = `GET /\nContent-Type: multipart/form-data\n@body\nkey=value`
            const expected = expectation("GET", ["/"], [["Content-Type", "multipart/form-data"]], "multipart(key=value)");

            assert(httpRequest, expected);

        })

        it('explicit urlencoded content type sets form type to urlencoded even with files attached', () => {

            const httpRequest = `GET /\nContent-Type: application/x-www-form-urlencoded\n@body\nkey=readFile()`
            const expected = expectation("GET", ["/"], [["Content-Type", "application/x-www-form-urlencoded"]], "urlencoded(key=function(readFile))");

            assert(httpRequest, expected);

        })



        it('key = variable', () => {

            const httpRequest = body(pair('key', '<value>'))
            const expected = expectation("GET", ["/"], [], "urlencoded(key=variable(<value>))");

            assert(httpRequest, expected);

        })

        for (const [template, fxExpected] of functions) {
            it(`key = ${fxExpected}`, () => {

                const httpRequest = body(pair('key', template))
                const expected = expectation("GET", ["/"], [], `urlencoded(key=${fxExpected})`);

                assert(httpRequest, expected);

            })
        }

        it('trims spaces before and after key value', () => {

            for (const whitespace of [...whitespaces]) {

                const httpRequest = body(pair('key', 'value', whitespace))
                const expected = expectation("GET", ["/"], [], "urlencoded(key=value)");

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


function assert(request: string, expected: Expectation) {
    const httpRequestAst = computeHttpAst(request);
    expect(valuesOf(httpRequestAst, request), request).toEqual(expected);
}


function expectation(method: string, url: string[] = [], headers: [string, string][] = [], body: string | null = null): Expectation {
    return {
        method: method,
        url: url,
        headers: headers.map(([k, v]) => ({ key: k, value: v })),
        body: body,
    }
}


function valuesOf(ast: HttpRequestAst, request: string): Expectation {
    const value = (node: HttpNode): string => {
        if (node.type === "variable") {
            return `variable(${request.slice(node.from, node.to)})`
        } else if (node.type === "function") {
            return expressionString(node as RequestFunction, request);
        } else if (node.type == 'json-value') {
            return `json-value(${value(node.value)})`
        }
        return request.slice(node.from, node.to);
    };

    const bodyValue = (body: JsonBodyNode | FormBodyNode | TextBodyNode | null) => {
        if (!body) return null;
        if (body.type === "json") return `json(${body.children.map(u => value(u)).join("")})`;
        if (body.type === "text") return `text(${value(body)})`;
        return `${body.type}(${body.entries.map(({ key, value: v }) => `${value(key)}=${expressionString(v, request)}`).join(",")})`;
    }

    return {
        method: value(ast.method),
        url: ast.url.map(u => value(u)),
        headers: ast.headers.map(({ key, value: v }) => ({ key: value(key), value: value(v) })),
        body: bodyValue(ast.body),
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


type Expectation = { method: string; url: string[]; headers: { key: string, value: string }[]; body: string | null; };