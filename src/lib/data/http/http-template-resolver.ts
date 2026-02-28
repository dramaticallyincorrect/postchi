import { computeHttpAst, HttpNode } from "@/lib/http/parser/http-ast"


export default function resolveHttpTemplate(template: string, context: ExecutionContext = { variables: new Map() }): HttpRequest {

    const ast = computeHttpAst(template);

    function value(node: HttpNode | null) {
        if (!node) {
            return "";
        }

        const text = template.substring(node.from, node.to);

        if (node.type === 'variable') {
            const key = text.replace(/[<>]/g, "");
            const value = context.variables.get(key);
            if (value !== undefined) {
                return value;
            }
        }

        return text
    }


    return {
        method: value(ast.method),
        url: ast.url.map(value).join(""),
        headers: ast.headers.map(h => [value(h.key), value(h.value)] as [string, string]),
        body: value(ast.body)
    }

}

type ExecutionContext = {
    variables: Map<string, string>
}


export type HttpRequest = {
    method: string,
    url: string,
    headers: [string, string][],
    body: string
}