export type HttpRequestAst = {
    method: Node;
    url: (Variable | Node)[];
    headers: { key: Node, value: Expression }[];
    body: Expression;
    errors: HttpParseError[];
};

type Node = {
    type: string;
    from: number;
    to: number;
}

type Literal = {
    type: "literal";
    from: number;
    to: number;
}

export type RequestFunction = {
    type: "function";
    from: number;
    to: number;
    name: Literal;
    args: Expression[];
}

type Variable = {
    type: "variable";
    from: number;
    to: number;
}

export type HttpParseError = {
    message: string;
    from: number;
    to: number;
}

export enum HttpErrorMessage {
    MissingUrl = "Missing URL",
    MissingKey = "Missing header key",
    WrongUrlProtocol = "URL should start with / for relative urls or http:// | https:// for absolute urls",
    MissingValue = "Missing header value",
}


export type Expression = Variable | RequestFunction | Literal;


export function computeHttpAst(request: string): HttpRequestAst {

    var hasProccessedRequestLine = false;

    const ast: HttpRequestAst = {
        method: { type: "method", from: 0, to: 0 },
        url: [],
        headers: [],
        body: { type: "literal", from: 0, to: 0 },
        errors: []
    }

    var hasProccessedRequestLine = false;
    var startBody = false;


    for (const line of lines(request)) {

        if (request.slice(line.start, line.end).trim().startsWith("//")) {
            continue
        }

        if (!hasProccessedRequestLine) {
            const [method, url] = parseRequestLine(line, request);
            ast.method = method;
            ast.url = url;
            hasProccessedRequestLine = true;
            if (ast.url.length === 0) {
                ast.errors.push({
                    message: HttpErrorMessage.MissingUrl,
                    from: line.end,
                    to: line.end
                })
            } else {
                const urlString = request.slice(url[0].from, url[0].to);
                if (!urlString.startsWith('/') && !urlString.startsWith("http://") && !urlString.startsWith("https://") && !urlString.startsWith("<")) {
                    ast.errors.push({
                        message: HttpErrorMessage.WrongUrlProtocol,
                        from: url[0].from,
                        to: url[0].to
                    })
                }
            }
        } else if (!startBody) {

            let [start, keyEnd] = line.toNoneWhitespaceBefore(":");
            line.toAfter(":");
            line.skipWhitespace();

            const key = {
                type: "literal",
                from: start,
                to: keyEnd
            }

            if (key.from == key.to) {
                ast.errors.push({
                    message: HttpErrorMessage.MissingKey,
                    from: keyEnd,
                    to: keyEnd
                });
            }

            if (request.slice(key.from, key.to).toLowerCase() === "@body") {
                startBody = true;
                continue
            }

            const value = expression(line, request);

            if (value.from == value.to) {
                const index = Math.max(key.to, value.from)
                ast.errors.push({
                    message: HttpErrorMessage.MissingValue,
                    from: index,
                    to: index
                });
            }

            ast.headers.push({
                key: key,
                value: value
            })

        } else {
            break
        }
    }

    return ast
}


function parseRequestLine(range: Line, request: string): [Node, (Variable | Literal)[]] {
    range.toNextWhitespace();
    const method = {
        type: "method",
        from: range.start,
        to: range.curr
    }

    const segments = parseSegments(range, request);

    return [method, segments];
}

function parseSegments(range: Line, request: string): (Variable | Literal)[] {
    range.skipWhitespace();
    const segments: (Variable | Literal)[] = [];

    // skip leading whitespace

    while (range.curr < range.end) {
        if (request[range.curr] === "<") {
            const begin = range.curr;
            range.toAfter(">");
            segments.push({
                type: "variable",
                from: begin,
                to: range.curr
            });
        } else {
            const begin = range.curr;
            range.toBefore("<");
            segments.push({
                type: "literal",
                from: begin,
                to: range.curr
            });
        }

    }


    return segments;
}


class Line {
    readonly start: number;
    readonly end: number;
    private container: string;
    curr: number;

    constructor(start: number, end: number, container: string) {
        this.start = start;
        this.end = end;
        this.container = container;
        this.curr = start;
    }

    eol(): boolean {
        return this.curr >= this.end;
    }

    toNextWhitespace() {
        while (this.curr < this.end && this.container[this.curr] !== " " && this.container[this.curr] !== "\t") {
            this.curr++;
        }
    }

    skipWhitespace() {
        while (this.curr < this.end && (this.container[this.curr] === " " || this.container[this.curr] === "\t")) {
            this.curr++;
        }
    }

    toBefore(character: string | string[]) {
        if (typeof character === "string") {
            while (this.curr < this.end && this.container[this.curr] !== character) {
                this.curr++;
            }
        } else {
            while (this.curr < this.end && !character.includes(this.container[this.curr])) {
                this.curr++;
            }
        }
    }

    consume(character: string) {
        if (this.curr < this.end && this.container[this.curr] === character) {
            this.curr++;
        }
    }

    toAfter(character: string) {
        while (this.curr < this.end && this.container[this.curr] !== character) {
            this.curr++;
        }
        if (this.curr < this.end && this.container[this.curr] === character) {
            this.curr++;
        }
    }

    toNoneWhitespaceBefore(terminator: string): [number, number] {
        const begin = this.curr;
        let lastCharacterIndexBeforeColon = this.curr;
        while (this.curr < this.end && this.container[this.curr] !== terminator) {
            if (this.notWhitespace()) {
                lastCharacterIndexBeforeColon++;
            }
            this.curr++;
        }
        return [begin, lastCharacterIndexBeforeColon];
    }

    current(): string {
        return this.container[this.curr]
    }

    is(character: string): boolean {
        return this.current() === character;
    }

    not(character: string): boolean {
        return this.current() !== character;
    }

    notWhitespace(): boolean {
        return this.not(' ') && this.not('\t');
    }

}


/**
 * Splits the input into lines and yields the start and end index of each line, excluding leading whitespace and new line characters.
 * @param input the text to split into lines
 */
function* lines(input: string): Generator<Line> {
    let start = 0;

    while (start < input.length) {
        const newline = input.indexOf("\n", start);
        const end = newline === -1 ? input.length : newline;

        // skip leading whitespace
        while (start < end && (input[start] == ' ' || input[start] == '\t')) {
            start++;
        }

        // skip empty lines
        if (start === end) {
            start = end + 1;
            continue
        }

        yield new Line(start, end, input);

        start = end + 1;
    }
}


function expression(range: Line, input: string): Expression {
    if (range.curr >= range.end) {
        return { type: "literal", from: range.end, to: range.end };
    }


    function parseIdentifier(): string {
        const start = range.curr;
        range.toBefore(['(', ')', ',']);
        return input.slice(start, range.curr);
    }

    function parseExpression(): Expression {
        range.skipWhitespace();
        const from = range.curr;

        // Variable: <name>
        if (range.is("<")) {
            range.toAfter(">");
            return { type: "variable", from, to: range.curr };
        }

        // Read identifier
        const name = parseIdentifier();
        const nameNode: Literal = { type: "literal", from, to: range.curr };
        if (name === "") return nameNode;

        // Function: name(args...)
        if (range.is("(")) {
            range.toAfter("(");
            const args: Expression[] = [];

            while (!range.eol() && !range.is(")")) {
                range.skipWhitespace();
                if (range.is(")")) break;
                args.push(parseExpression());
                range.skipWhitespace();
                range.consume(",");
            }

            if (range.not(")")) throw new Error("Unterminated function call");
            range.toAfter(")");

            return { type: "function", from, to: range.curr, name: nameNode, args };
        }

        // Literal
        return { type: "literal", from, to: range.curr };
    }

    return parseExpression();
}