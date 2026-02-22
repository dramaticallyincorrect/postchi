import { describe, expect, it, test } from "vitest";
import { computeHttpAst, Expression, HttpErrorMessage, HttpRequestAst, RequestFunction } from "./http-ast";

const whitespaces = [' ', '  ', '   ', '\t', ' \t\t']
const newlines = ['\n', '\n\n', '\n\n\n']

describe("request line", () => {

    test("emptyline* method /", () => {
        const httpRequest = `\n\nGET /`
        const expected = expectation("GET", ["/"]);

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })

    test("method /", () => {
        const httpRequest = `GET /`
        const expected = expectation("GET", ["/"])

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })

    test("method url", () => {
        const httpRequest = `GET /this/is/a/test`
        const expected = expectation("GET", ["/this/is/a/test"]);

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })


    test("method whitespace url", () => {
        const httpRequest = `GET   /this/is/a/test`
        const expected = expectation("GET", ["/this/is/a/test"]);

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })

    test("method variable", () => {
        const httpRequest = `GET <api>`
        const expected = expectation("GET", ['variable(<api>)']);

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })

    test("method variable + path", () => {
        const httpRequest = `GET <api>/users<userid>`
        const expected = expectation("GET", ['variable(<api>)', '/users', 'variable(<userid>)'])

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })


    test("comment method url", () => {
        const httpRequest = `// this is a comment\nGET /`
        const expected = expectation("GET", ["/"])

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })

    test("whitespace method url", () => {
        const httpRequest = `     GET /`
        const expected = expectation("GET", ["/"])

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })

})


describe("headers", () => {

    test("comment key space? : space? value", () => {


        for (const whitespace of ['', ...whitespaces]) {
            const httpRequest = `//this is a comment\nGET /\nContent-Type${whitespace}:${whitespace}application/json`
            const expected = expectation("GET", ["/"], [["Content-Type", "application/json"]]);

            const httpRequestAst = computeHttpAst(httpRequest);

            expect(valuesOf(httpRequestAst, httpRequest), httpRequest + '<eof>\n\n').toEqual(expected);
        }
    })

    test("key space? : space? value", () => {


        for (const whitespace of ['', ...whitespaces]) {
            const httpRequest = `GET /\nContent-Type${whitespace}:${whitespace}application/json`
            const expected = expectation("GET", ["/"], [["Content-Type", "application/json"]]);

            const httpRequestAst = computeHttpAst(httpRequest);

            expect(valuesOf(httpRequestAst, httpRequest), httpRequest + '<eof>\n\n').toEqual(expected);
        }
    })

    test("key space? : space? variable", () => {

        for (const whitespace of ['',]) {
            const httpRequest = `GET /\nContent-Type${whitespace}:${whitespace}<content_type>`
            const expected = expectation("GET", ["/"], [["Content-Type", "variable(<content_type>)"]]);

            const httpRequestAst = computeHttpAst(httpRequest);

            expect(valuesOf(httpRequestAst, httpRequest), httpRequest + '<eof>\n\n').toEqual(expected);
        }
    })

    test("key space? : space? function", () => {

        for (const whitespace of ['', ...whitespaces]) {
            const httpRequest = `GET /\nContent-Type${whitespace}:${whitespace}time()`
            const expected = expectation("GET", ["/"], [["Content-Type", "function(time)"]]);

            const httpRequestAst = computeHttpAst(httpRequest);

            expect(valuesOf(httpRequestAst, httpRequest), httpRequest + '<eof>\n\n').toEqual(expected);
        }
    })

    test("key space? : space? function(literal, variable, function(function))", () => {

        for (const whitespace of ['', ...whitespaces]) {
            const httpRequest = `GET /\nContent-Type${whitespace}:${whitespace}basic(username, <password>, date())`
            const expected = expectation("GET", ["/"], [["Content-Type", "function(basic, username, variable(<password>), function(date))"]]);

            const httpRequestAst = computeHttpAst(httpRequest);

            expect(valuesOf(httpRequestAst, httpRequest), httpRequest + '<eof>\n\n').toEqual(expected);
        }
    })
})


describe("body", () => {

    test('@body _', () => {

        const httpRequest = `
GET /
@body`
        const expected = expectation("GET", ["/"], [], "");

        const httpRequestAst = computeHttpAst(httpRequest);

        expect(valuesOf(httpRequestAst, httpRequest)).toEqual(expected);

    })


})


describe("errors", () => {

    it('missing url', () => {
        for (const whitespace of ['', ...newlines, ...whitespaces]) {
            const httpRequest = `GET${whitespace}`
            const expected = expectation("GET", [], [], "", [HttpErrorMessage.MissingUrl]);

            assert(httpRequest, expected);
        }
    })

    it("key :? space?", () => {

        for (const addIn of ['', ':', ': ', ' : \n', '\n', ...whitespaces]) {
            const httpRequest = `GET /\nuser-agent${addIn}`
            const expected: Expectation = expectation("GET", ["/"], [['user-agent', '']], "", [HttpErrorMessage.MissingValue]);

            assert(httpRequest, expected);
        }
    })

})


function assert(request: string, expected: Expectation) {
    const httpRequestAst = computeHttpAst(request);
    expect(valuesOf(httpRequestAst, request), request).toEqual(expected);
}


function expectation(method: string, url: string[] = [], headers: [string, string][] = [], body: string = "", errors: HttpErrorMessage[] = []): Expectation {
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

    return {
        method: value(ast.method),
        url: ast.url.map(u => value(u)),
        headers: ast.headers.map(({ key, value: v }) => ({ key: value(key), value: value(v) })),
        body: value(ast.body),
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


type Expectation = { method: string; url: string[]; headers: { key: string, value: string }[]; body: string; errors: string };