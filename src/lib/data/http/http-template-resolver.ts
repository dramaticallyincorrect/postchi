import { computeHttpAst } from "@/lib/http/parser/http-ast"


export default function resolveHttpTemplate(template: string): HttpRequest {

    const ast = computeHttpAst(template);

    const value = (node: { from: number, to: number }) => template.substring(node.from, node.to)


    return {
        method: value(ast.method),
        url: ast.url.map(value).join(""),
        headers: ast.headers.map(h => [value(h.key), value(h.value)] as [string, string]),
        body: value(ast.body)
    }

}


export type HttpRequest = {
    method: string,
    url: string,
    headers: [string, string][],
    body: string
}