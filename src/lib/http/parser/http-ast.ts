
export type HttpRequestAst = {
    method: Method;
    url: (Variable | Literal)[];
    headers: HeaderNode[];
    body: JsonBodyNode | FormBodyNode | TextBodyNode | null;
    errors: HttpParseError[];
};

export type HttpNode = Method | Variable | Literal | HeaderNode | FormBodyNode | JsonBodyNode | TextBodyNode | RequestFunction;

type Method = {
    type: "method";
    from: number;
    to: number;
}

export type FormBodyNode = {
    type: 'urlencoded' | 'multipart';
    from: number;
    to: number;
    entries: HeaderNode[];
}

export type JsonBodyNode = {
    type: "json";
    from: number;
    to: number;
}

export type TextBodyNode = {
    type: "text";
    from: number;
    to: number;
}

export type HeaderNode = {
    type: "header";
    from: number;
    to: number;
    key: Literal;
    separator: number | undefined;
    value: Expression;
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
    VariableNotDefined = "Variable not defined in the active environment",
    MalformedVariable = "variables should be in the format <variableName>",
    UrlEncodedWithAttachedFile = "URL encoded body cannot have files attached to it, consider using multipart form data instead"
}


export type Expression = Variable | RequestFunction | Literal;


export function computeHttpAst(request: string): HttpRequestAst {

    var hasProccessedRequestLine = false;

    const ast: HttpRequestAst = {
        method: { type: "method", from: 0, to: 0 },
        url: [],
        headers: [],
        body: null,
        errors: []
    }

    var hasProccessedRequestLine = false;
    var startBody = false;

    const linesGenerator = lines(request);
    for (const line of linesGenerator) {

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

            const headerNode = pair(line, request, ":");

            if (request.slice(headerNode.key.from, headerNode.key.to).toLowerCase() === "@body") {
                startBody = true;
                continue
            }

            if (headerNode.key.from == headerNode.key.to) {
                ast.errors.push({
                    message: HttpErrorMessage.MissingKey,
                    from: headerNode.key.from,
                    to: headerNode.key.to
                });
            }

            if (headerNode.value.from == headerNode.value.to) {
                const index = Math.max(headerNode.key.to, headerNode.value.from)
                ast.errors.push({
                    message: HttpErrorMessage.MissingValue,
                    from: index,
                    to: index
                });
            }

            ast.headers.push(headerNode)

        } else {
            line.skipWhitespace();

            const bodyText = request.slice(line.curr).trim();
            const bodyStart = line.curr;
            const bodyEnd = bodyStart + bodyText.length;
            const explicitContentType = contentTypeFromHeaders(ast.headers, request);
            const computedBodyType = bodyType(explicitContentType) ?? inferContentType(bodyText);

            if (computedBodyType === "form") {
                const keyValuePairs: HeaderNode[] = [];
                
                let formType = formContentType(explicitContentType);
                for (const entry of [line, ...linesGenerator]) {
                    const headerNode = pair(entry, request, "=");
                    keyValuePairs.push(headerNode)
                    if (headerNode.value.type === "function" && request.slice(headerNode.value.name.from, headerNode.value.name.to).toLowerCase() === "readfile") {
                        if (!explicitContentType) {
                            // if the content type is not explicitly set and there is a file attached, we consider it as multipart form data
                            formType = "multipart";
                        }

                        if (explicitContentType && formType === "urlencoded") {
                            ast.errors.push({
                                message: HttpErrorMessage.UrlEncodedWithAttachedFile,
                                from: headerNode.value.from,
                                to: headerNode.value.to
                            })
                        }
                    }
                }
                ast.body = {
                    type: formType,
                    from: bodyStart,
                    to: bodyEnd,
                    entries: keyValuePairs
                }
                break;
            } else {
                ast.body = {
                    type: computedBodyType === "json" ? "json" : "text",
                    from: bodyStart,
                    to: bodyEnd,
                }
            }
            break;
        }
    }

    return ast
}


function parseRequestLine(range: Line, request: string): [Method, (Variable | Literal)[]] {
    range.toNextWhitespace();
    const method: Method = {
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
            const [start, end] = range.toNoneWhitespaceBefore("<");
            segments.push({
                type: "literal",
                from: start,
                to: end
            });
        }

    }


    return segments;
}

function pair(line: Line, request: string, separator: string): HeaderNode {
    let [start, keyEnd] = line.toNoneWhitespaceBefore(separator);
    line.toAfter(separator);
    let separatorIndex = undefined;
    if (request[line.curr - 1] === separator) {
        separatorIndex = line.curr - 1;
    }
    line.skipWhitespace();

    const key: Literal = {
        type: "literal",
        from: start,
        to: keyEnd
    }

    const value = expression(line, request);

    return {
        type: "header",
        from: line.start,
        to: line.end,
        key,
        value,
        separator: separatorIndex
    }
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
        while (this.curr < this.end && !this.isWhitespace()) {
            this.curr++;
        }
    }

    skipWhitespace() {
        while (this.curr < this.end && this.isWhitespace()) {
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

    toNoneWhitespaceBefore(terminator: string | string[]): [number, number] {
        const begin = this.curr;
        let lastCharacterIndexBeforeColon = this.curr;
        while (this.curr < this.end && (typeof terminator === "string" ? this.container[this.curr] !== terminator : !terminator.includes(this.container[this.curr]))) {
            if (this.notWhitespace()) {
                lastCharacterIndexBeforeColon = this.curr + 1;
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

    isWhitespace(): boolean {
        return this.is(' ') || this.is('\t');
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


    function parseIdentifier(): [number, number] {
        return range.toNoneWhitespaceBefore(['(', ')', ',']);
    }

    function parseExpression(): Expression {
        range.skipWhitespace();
        const from = range.curr;

        if (range.is("<")) {
            range.toAfter(">");
            return { type: "variable", from, to: range.curr };
        }

        const [nameStart, nameEnd] = parseIdentifier();
        const nameNode: Literal = { type: "literal", from: nameStart, to: nameEnd };
        if (nameStart === nameEnd) return nameNode;

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

        return { type: "literal", from: nameStart, to: nameEnd };
    }

    return parseExpression();
}

function bodyType(contentType: string | null): string | null {
    if (!contentType) {
        return null;
    }
    switch (contentType.toLowerCase()) {
        case "application/json":
        case "application/json; charset=utf-8":
            return "json";
        case "application/x-www-form-urlencoded":
            return "form";
        case "multipart/form-data":
            return "form";
        default:
            return 'text';
    }
}

function formContentType(contentType: string | null): 'urlencoded' | 'multipart' {
    if (!contentType) {
        return "urlencoded";
    }
    switch (contentType?.toLowerCase()) {
        case "application/x-www-form-urlencoded":
            return "urlencoded";
        case "multipart/form-data":
            return "multipart";
        default:
            throw new Error(`Unsupported content type for form body: ${contentType}`);
    }
}

function contentTypeFromHeaders(headers: HeaderNode[], request: string): string | null {
    const contentTypeHeaderNode = headers.find(h => request.slice(h.key.from, h.key.to).toLowerCase() === "content-type");
    return contentTypeHeaderNode?.value ? request.slice(contentTypeHeaderNode.value.from, contentTypeHeaderNode.value.to).toLowerCase() : null;
}

function inferContentType(bodyText: string): string {
    if (bodyText.startsWith("{") || bodyText.startsWith("[")) {
        return "json";
    }
    if (bodyText.includes('=')) {
        return "form";
    }
    return "text";
}