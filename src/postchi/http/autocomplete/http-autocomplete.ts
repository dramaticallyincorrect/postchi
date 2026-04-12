import { Completion, CompletionContext, CompletionResult, CompletionSection, snippetCompletion } from "@codemirror/autocomplete"
import { httpHeaders } from "./http-headers"
import DefaultFileStorage from "@/lib/storage/files/file-default"
import { asVariable } from "@/lib/utils/variable-name"
import { json } from '@codemirror/lang-json';
import { computeHttpAst, Expression, FormBodyNode, HeaderNode, HttpNode, HttpRequestAst } from "../parser/http-ast";
import httpFunctions from "../functions/http-functions";
import { OpenAPIV3 } from "openapi-types";
import { walkSchema } from "@/lib/open-api/open-api-inspector";
import { pathAtPosition } from "@/lib/json-parser-utils";

export const completeHttp = (variables: { key: string, value: string }[], spec?: OpenAPIV3.OperationObject) => (context: CompletionContext) => {
    return computeHttpCompletions(context.pos,
        context.state.doc.toString(),
        (position: number) => context.state.doc.lineAt(position).number,
        variables,
        spec)
}

export default completeHttp

type AutoCompleteContext = {
    position: number
    doc: string
    variables: { key: string; value: string; }[]
    spec: OpenAPIV3.OperationObject | undefined
}

export async function computeHttpCompletions(position: number, doc: string, lineAt: (position: number) => number, variables: { key: string; value: string; }[] = [], spec?: OpenAPIV3.OperationObject): Promise<CompletionResult> {
    const ast = computeHttpAst(doc)

    const node = findNodeAtPosition(position, ast)

    const context: AutoCompleteContext = {
        doc,
        position,
        variables,
        spec
    }


    switch (node?.type) {
        case 'query-param':
            if (position >= node.key.to && spec) {
                const name = doc.slice(node.key.from, node.key.to)
                const enums = getOperationEnumsFor(spec, name)
                if (enums) {
                    return {
                        from: node.separator ? node.value.from : position,
                        options: enumCompletions(enums)
                    }
                }
            }
            break;
        case "method":
            return {
                from: node.from,
                options: methods,
            }
        case 'variable':
            return {
                from: node.from,
                options: variableCompletions(variables),
            }
        case "header":
            return headerCompletions(node as HeaderNode, context)
        case 'urlencoded':
        case 'multipart':
            const formNode = node as FormBodyNode
            const line = lineAt(position)
            const entry = formNode.entries.find(entry => line == lineAt(entry.from))
            if (entry?.separator && position > entry.separator) {
                return provideFunctionCompletions(entry.value, context)
            }
            break;
        case 'json':
            return jsonCompletion(context)
            break;
    }

    return {
        from: 0,
        options: []
    }
}

async function provideFunctionCompletions(expression: Expression, context: AutoCompleteContext) {
    if (expression.type === 'variable') {
        return {
            from: expression.from,
            options: variableCompletions(context.variables),
        }
    }

    if (expression.type == 'function') {

        if (context.position < expression.name.to) {
            return {
                from: 0,
                options: [],
            }
        }

        const arg = expression.args.find(arg => context.position >= arg.from && context.position <= arg.to)

        if (arg && arg.type == 'function') {
            return provideFunctionCompletions(arg, context)
        }

        const name = context.doc.slice(expression.name.from, expression.name.to)
        if (name == 'readText' || name == 'readFile') {

            const from = arg?.from || context.position
            const argText = arg ? context.doc.slice(arg.from, arg.to) : '/'
            const completions = await pathCompletion(argText)
            const result = {
                from: from,
                options: completions,
            }
            return result
        }

        return {
            from: arg?.from || context.position,
            options: [variableCompletions(context.variables), functionCompletions].flat(),
        }

    } else {
        return {
            from: expression.from,
            options: functionCompletions,
        }
    }
}


export const methods = [
    { label: 'GET', type: "keyword" },
    { label: 'POST', type: "keyword" },
    { label: 'PUT', type: "keyword" },
    { label: 'DELETE', type: "keyword" },
    { label: 'PATCH', type: "keyword" },
    { label: 'HEAD', type: "keyword" },
    { label: 'OPTIONS', type: "keyword" },
]

export const SPEC_SECTION: CompletionSection = {
    name: "From Spec",
    rank: -100
}

export async function pathCompletion(path: string, fileStorage = DefaultFileStorage.getInstance()): Promise<Completion[]> {
    // TODO: handle Windows file separator
    const parent = path.substring(0, path.lastIndexOf('/')) || '/'
    const entries = await fileStorage.readDirectory(parent)
    return entries.map(entry => ({
        label: entry.path,
        type: 'text',
    }))
}


async function headerCompletions(node: HeaderNode, context: AutoCompleteContext): Promise<CompletionResult> {
    if (context.position <= node.key.to) {
        const headerOptions = context.spec ? enumCompletions(getOperationHeaders(context.spec), SPEC_SECTION) : []
        return {
            from: node.key.from,
            options: [
                bodySnippet,
                headerOptions,
                allHeaderCompletions
            ].flat(),
        }
    } else {
        return provideFunctionCompletions(node.value, context).then(result => {
            const headerName = context.doc.slice(node.key.from, node.key.to).toLowerCase()
            const operationEnumvs = context.spec ? enumCompletions(getOperationEnumsFor(context.spec, headerName, 'header'), SPEC_SECTION) : []
            result.options = [headerName === 'content-type' ? contentTypeCompletions : [], operationEnumvs, result.options].flat()
            return result
        })
    }
}

function jsonCompletion(context: AutoCompleteContext): CompletionResult {
    const jsonTree = json().language.parser.parse(context.doc)
    const jsonNode = jsonTree.resolveInner(context.position, -1)
    const isInsideString = jsonNode.name === 'String'
    const fromPos = jsonNode.from + 1

    const spec = context.spec
    if (spec) {
        const schema = extractJsonBodySchema(spec)
        if (schema) {
            const location = pathAtPosition(jsonNode, context.doc)

            if (location?.role === 'key') {
                const schemaNode = walkSchema(schema, location.path)
                const available = schemaNode?.properties?.filter(p => !location.existingKeys.includes(p)) ?? []
                return { from: jsonNode.from + 1, options: available.map(p => ({ label: p, type: 'property' })) }
            }

            if (location?.role === 'value') {
                const schemaNode = walkSchema(schema, location.path)
                const enumOptions = enumCompletions(schemaNode?.enum, SPEC_SECTION) ?? []
                return { from: fromPos, options: [...enumOptions, ...variableCompletions(context.variables)] }
            }
        }
    }

    if (isInsideString) {
        return { from: fromPos, options: variableCompletions(context.variables) }
    }

    return {
        from: 0,
        options: []
    }
}

function findNodeAtPosition(position: number, ast: HttpRequestAst): HttpNode | undefined {
    const nodes = [ast.method, ...ast.url, ...ast.headers, ...(ast.body ? [ast.body] : [])]

    return nodes.find(node => position >= node.from && position <= node.to)
}

export function variableCompletions(variables: { key: string, value: string }[]): Completion[] {
    return variables.map(variable => ({
        displayLabel: variable.key,
        label: asVariable(variable.key),
        detail: variable.value,
        type: "variable",
        section: {
            name: "Variables",
            rank: -10
        }
    }))
}

export const functionCompletions = Array.from(httpFunctions.entries()).map(([name, fn]) => {
    const params = fn.parameters.map((p, i) => `\${${i + 1}:${p}}`).join(', ')

    return snippetCompletion(`${name}(${params})`, {
        label: name,
        detail: `(${fn.parameters.join(', ')})`,
        type: 'function'
    })
})

export const allHeaderCompletions = httpHeaders.map(header => ({ label: `${header}:`, type: "keyword" }))

export const bodySnippet = snippetCompletion('@body\n\n{\n\t"${1}": ""\n}', {
    label: 'json body',
    type: 'text'
})

function extractJsonBodySchema(spec: OpenAPIV3.OperationObject): OpenAPIV3.SchemaObject | undefined {
    const requestBody = spec.requestBody
    if (!requestBody || '$ref' in requestBody) return undefined
    const content = requestBody.content['application/json']
    if (!content?.schema || '$ref' in content.schema) return undefined
    return content.schema
}


type ParameterSchemaLocation = 'query' | 'header'

function enumCompletions(enums: any[] | undefined, section: CompletionSection | undefined = undefined): Completion[] {
    return enums?.map(e => ({ label: String(e), type: 'enum', section })) ?? []
}

function getOperationEnumsFor(
    operation: OpenAPIV3.OperationObject,
    parameterName: string,
    location: ParameterSchemaLocation = 'query'
): any[] | undefined {


    const param = operation.parameters?.find((p): p is OpenAPIV3.ParameterObject => {
        return !('$ref' in p) && p.name === parameterName && p.in === location;
    });

    if (!param || !param.schema) {
        return undefined;
    }

    const schema = param.schema as OpenAPIV3.SchemaObject;

    return schema.enum;
}


function getOperationHeaders(
    operation: OpenAPIV3.OperationObject,
): any[] {

    // 1. Find the specific query parameter by name and location
    const params = operation.parameters?.filter((p): p is OpenAPIV3.ParameterObject => {
        // We check 'in' to ensure it's a query param and 'name' for the match
        // Note: p is OpenAPIV3.ParameterObject assumes the spec is dereferenced
        return !('$ref' in p) && p.in === 'header';
    });


    return params?.map(p => p.name) ?? [];
}

export const contentTypeCompletions = [
    // Text
    'text/html',
    'text/plain',
    'text/css',
    'text/csv',
    'text/javascript',

    // Application
    'application/json',
    'application/xml',
    'application/x-www-form-urlencoded',
    'application/octet-stream',

    // Image
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',

    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',

    // Video
    'video/mp4',
    'video/webm',

    // Multipart
    'multipart/form-data',
].map(contentType => ({ label: contentType, type: 'text' }));