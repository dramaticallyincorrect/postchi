

export type HttpRequestAst = {
    method: Node;
    url: (Variable | Node)[];
    headers: { key: Node, value: Expression }[];
    body: Expression;
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


export type Expression = Variable | RequestFunction | Literal;


export function computeHttpAst(request: string): HttpRequestAst {



    var hasProccessedRequestLine = false;

    const ast: HttpRequestAst = {
        method: { type: "method", from: 0, to: 0 },
        url: [],
        headers: [],
        body: { type: "literal", from: 0, to: 0 },
    }

    var hasProccessedRequestLine = false;
    var startBody = false;


    for (const line of lines(request)) {

        function lastCharacterIndexBefore(terminator: string): [number, number] {
            let lastCharacterIndexBeforeColon = line.start;
            let start = line.start
            while (start < line.end && request[start] !== terminator) {
                if (request[start] !== ' ' && request[start] !== '\t') {
                    lastCharacterIndexBeforeColon++;
                }
                start++;
            }
            return [start, lastCharacterIndexBeforeColon];
        }

        if (request.slice(line.start, line.end).trim().startsWith("//")) {
            continue
        }

        if (!hasProccessedRequestLine) {
            const [method, url] = parseRequestLine(line, request);
            ast.method = method;
            ast.url = url;
            hasProccessedRequestLine = true;
        } else if (!startBody) {

            let [start, keyEnd] = lastCharacterIndexBefore(":");
            start++
            // skipt leading whitespace
            while (start < line.end && (request[start] === ' ' || request[start] === '\t')) {
                start++;
            }

            const key = {
                type: "literal",
                from: line.start,
                to: keyEnd
            }

            if (request.slice(key.from, key.to).toLowerCase() === "@body") {
                startBody = true;
                continue
            }

            const value = expression({ start: start, end: line.end }, request);

            ast.headers.push({
                key: key,
                value: value
            })

        }else {
            break
        }
    }

    return ast
}


function parseRequestLine(range: Line, request: string): [Node, (Variable | Literal)[]] {
    const firstSpaceIndex = request.indexOf(" ", range.start);

    if (firstSpaceIndex === -1) {
        return [{
            type: "method",
            from: range.start,
            to: range.end
        }, []];
    }

    const segments = parseSegments({
        start: firstSpaceIndex + 1,
        end: range.end,
    }, request);

    return [{
        type: "method",
        from: range.start,
        to: firstSpaceIndex
    }, segments];
}

function parseSegments(range: Line, request: string): (Variable | Literal)[] {
    const segments: (Variable | Literal)[] = [];

    let start = range.start;

    // skip leading whitespace
    while (start < range.end && request[start] == ' ') {
        start++;
    }

    while (start < range.end) {
        if (request[start] === "<") {
            const end = request.indexOf(">", start + 1) || range.end;
            segments.push({
                type: "variable",
                from: start,
                to: end + 1
            });
            start = end + 1;
        } else {
            const begin = start
            while (start < range.end && request[start] !== "<") {
                start++;
            }
            segments.push({
                type: "literal",
                from: begin,
                to: start
            });
        }

    }


    return segments;
}


type Line = {
    start: number;
    end: number;
}


/**
 * 
 * Splits the input into lines and yields the start and end index of each line, excluding leading whitespace and new line characters.
 * @param input the text to split into lines
 */
function* lines(input: string): Generator<Line> {
    let start = 0;

    while (start < input.length) {
        const newline = input.indexOf("\n", start);
        const end = newline === -1 ? input.length : newline;

        // skip leading whitespace
        while (start < end && input[start] == ' ') {
            start++;
        }

        // skip empty lines
        if (start === end) {
            start = end + 1;
            continue
        }

        yield { start, end };

        start = end + 1;
    }
}


function expression(range: Line, input: string): Expression {
    let pos = range.start;

    function skipWhitespace() {
        while (pos < input.length && input[pos] === " ") pos++;
    }

    function parseIdentifier(): string {
        let name = "";
        while (pos < input.length && input[pos] !== "(" && input[pos] !== ")" && input[pos] !== "," && input[pos] !== " ") {
            name += input[pos++];
        }
        return name;
    }

    function parseExpression(): Expression {
        skipWhitespace();
        const from = pos;

        // Variable: <name>
        if (input[pos] === "<") {
            while (pos < input.length && input[pos] !== ">") pos++;
            if (input[pos] === ">") pos++;
            return { type: "variable", from, to: pos };
        }

        // Read identifier
        const name = parseIdentifier();
        if (name === "") return { type: "literal", from, to: pos };

        // Function: name(args...)
        if (input[pos] === "(") {
            const nameNode: Literal = { type: "literal", from, to: pos };
            pos++; // skip '('
            const args: Expression[] = [];

            while (pos < input.length && input[pos] !== ")") {
                skipWhitespace();
                if (input[pos] === ")") break;
                args.push(parseExpression());
                skipWhitespace();
                if (input[pos] === ",") pos++; // skip ','
            }

            if (input[pos] !== ")") throw new Error("Unterminated function call");
            pos++; // skip ')'

            return { type: "function", from, to: pos, name: nameNode, args };
        }

        // Literal
        return { type: "literal", from, to: pos };
    }

    return parseExpression();
}