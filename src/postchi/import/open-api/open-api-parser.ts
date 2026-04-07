import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import * as yaml from 'js-yaml';
import { ImportedFolder, ImportedRequest } from '../postman/postman-parser';
import { fetchSpec, fetchWithGitLabAuth, isGitLabUrl } from '@/lib/storage/integrations/gitlab';
import { ApiKeyAuth, AuthMethod, HttpBasicAuth, HttpBearerAuth, SecurityRequirement } from '@/postchi/project/project';
import { RequestSpec } from '@/postchi/sources/request-spec';
import Task, { fromPromise, tryOrElse } from 'true-myth/task';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'] as const;

type HttpMethod = typeof HTTP_METHODS[number];

type OperationTuple = {
    pathPattern: string;
    method: string;
    operation: OpenAPIV3.OperationObject;
    pathLevelParams: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[];
    securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject | OpenAPIV3.ReferenceObject>;
};

export async function convertOpenApiToPostchi(filePath: string): Promise<ImportedFolder> {
    const doc = await SwaggerParser.dereference(filePath) as OpenAPIV3.Document;
    return convertDocumentToFolder(doc);
}

export async function fetchOpenApiSpecFromFile(file: File): Promise<OpenAPIV3.Document> {
    const content = await file.text();
    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch {
        parsed = yaml.load(content);
    }
    return SwaggerParser.dereference(parsed as OpenAPIV3.Document) as Promise<OpenAPIV3.Document>;
}


type SourceFetchError = {
    type: 'auth' | 'network' | 'parse';
    message: string
}

function toSourceFetchError(err: { status: number; message: string }): SourceFetchError {
    return { type: err.status === 401 ? 'auth' : 'network', message: err.message };
}

export function fetchOpenApiSpec(url: string, token?: string): Task<OpenAPIV3.Document, SourceFetchError> {
    if (token && isGitLabUrl(url)) {
        return fetchWithGitLabAuth(url, token)
            .mapRejected(toSourceFetchError)
            .andThen(raw =>
                tryOrElse(
                    e => ({ type: 'parse' as const, message: String(e) }),
                    () => SwaggerParser.dereference(raw as OpenAPIV3.Document) as Promise<OpenAPIV3.Document>
                )
            );
    }

    return fromPromise(
        SwaggerParser.dereference(url) as Promise<OpenAPIV3.Document>,
        () => null as never
    ).orElse(() =>
        tryOrElse(
            e => ({ type: 'network' as const, message: String(e) }),
            async () => {
                const spec = await fetchSpec(url);
                return SwaggerParser.dereference(spec as OpenAPIV3.Document) as Promise<OpenAPIV3.Document>;
            }
        )
    );
}

export function convertDocumentToFolder(doc: OpenAPIV3.Document): ImportedFolder {
    const tagBuckets = new Map<string, OperationTuple[]>();
    const untagged: OperationTuple[] = [];
    const securitySchemes = doc.components?.securitySchemes ?? {};

    for (const [pathPattern, pathItem] of Object.entries(doc.paths ?? {})) {
        if (!pathItem) continue;
        const pathLevelParams = pathItem.parameters ?? [];

        for (const method of HTTP_METHODS) {
            const operation = pathItem[method as HttpMethod] as OpenAPIV3.OperationObject | undefined;
            if (!operation) continue;

            const tuple: OperationTuple = { pathPattern, method, operation, pathLevelParams, securitySchemes };
            const firstTag = operation.tags?.[0];

            if (firstTag) {
                if (!tagBuckets.has(firstTag)) tagBuckets.set(firstTag, []);
                tagBuckets.get(firstTag)!.push(tuple);
            } else {
                untagged.push(tuple);
            }
        }
    }

    const items: (ImportedFolder | ImportedRequest)[] = [];

    for (const [tag, ops] of tagBuckets) {
        items.push(convertTagToFolder(tag, ops));
    }

    for (const tuple of untagged) {
        items.push(convertOperationToRequest(tuple));
    }

    return { name: doc.info.title, items };
}

function convertTagToFolder(tag: string, ops: OperationTuple[]): ImportedFolder {
    return {
        name: tag,
        items: ops.map(convertOperationToRequest),
    };
}

function convertOperationToRequest(tuple: OperationTuple): ImportedRequest {
    return {
        name: getRequestName(tuple.operation, tuple.method, tuple.pathPattern),
        request: buildRequestText(tuple),
        spec: buildRequestSpec(tuple.method, tuple.pathPattern, tuple.operation),
    };
}

export function getRequestName(operation: OpenAPIV3.OperationObject, method: string, pathPattern: string): string {
    if (operation.summary?.trim()) return operation.summary.trim();
    if (operation.operationId) return operation.operationId;
    return `${method.toUpperCase()} ${pathPattern}`;
}

function resolveSecurityForRequestText(
    security: OpenAPIV3.SecurityRequirementObject[],
    securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject | OpenAPIV3.ReferenceObject>,
): { authHeaders: string[]; authQueryParams: string[] } {
    if (security.length === 0) return { authHeaders: [], authQueryParams: [] }

    const authHeaders: string[] = []
    const authQueryParams: string[] = []

    for (const [schemeName] of Object.entries(security[0])) {
        const schemeOrRef = securitySchemes[schemeName]
        if (!schemeOrRef || '$ref' in schemeOrRef) continue

        const authMethod = schemeToAuthMethod(schemeName, schemeOrRef)
        if (!authMethod) continue

        if (authMethod.type === 'http' && authMethod.scheme === 'bearer') {
            authHeaders.push(`Authorization: bearer(<${authMethod.tokenVariable}>)`)
        } else if (authMethod.type === 'http' && authMethod.scheme === 'basic') {
            authHeaders.push(`Authorization: basicAuth(<${authMethod.usernameVariable}>,<${authMethod.passwordVariable}>)`)
        } else if (authMethod.type === 'apiKey' && authMethod.in === 'header') {
            authHeaders.push(`${authMethod.name}: <${authMethod.keyVariable}>`)
        } else if (authMethod.type === 'apiKey' && authMethod.in === 'query') {
            authQueryParams.push(`${authMethod.name}=<${authMethod.keyVariable}>`)
        }
    }

    return { authHeaders, authQueryParams }
}

function buildRequestText(tuple: OperationTuple): string {
    const { pathPattern, method, operation, pathLevelParams, securitySchemes } = tuple;

    // Merge path-level and operation-level params; operation-level wins on (name, in) conflict
    const paramMap = new Map<string, OpenAPIV3.ParameterObject>();
    for (const p of [...pathLevelParams, ...(operation.parameters ?? [])]) {
        if (!isParameterObject(p)) continue;
        paramMap.set(`${p.in}:${p.name}`, p);
    }
    const params = Array.from(paramMap.values());

    const queryParams = params.filter(p => p.in === 'query');
    const headerParams = params.filter(p => p.in === 'header');

    const authForText = operation.security !== undefined
        ? resolveSecurityForRequestText(operation.security, securitySchemes)
        : { authHeaders: [], authQueryParams: [] }

    // Build URL: relative path with {param} → <param>, then append query string
    const path = pathPattern.replace(/\{(\w+)\}/g, '<$1>');
    const allQueryParts = [
        ...queryParams.map(p => {
            const schema = p.schema as OpenAPIV3.SchemaObject | undefined
            const value = schema?.example !== undefined ? String(schema.example) : `<${p.name}>`
            return `${p.name}=${value}`
        }),
        ...authForText.authQueryParams,
    ]
    const queryString = allQueryParts.join('&');
    const url = queryString ? `${path}?${queryString}` : path;

    const headers: string[] = headerParams.map(p => `${p.name}: <${p.name}>`);
    headers.push(...authForText.authHeaders);

    const requestBody = operation.requestBody;
    const body = requestBody && isRequestBodyObject(requestBody)
        ? buildBodySection(requestBody)
        : null;

    if (body) {
        headers.push(body.contentTypeHeader);
    }

    const requestLine = `${method.toUpperCase()} ${url}`;
    const headersString = headers.join('\n');
    const bodyText = body?.bodyText ?? '';

    const urlSeparator = headersString || bodyText ? '\n' : '';
    const bodySeparator = headersString && bodyText ? '\n' : '';

    return `${requestLine}${urlSeparator}${headersString}${bodySeparator}${bodyText ? `@body\n${bodyText}` : ''}`.trim();
}

function buildBodySection(requestBody: OpenAPIV3.RequestBodyObject): { contentTypeHeader: string; bodyText: string } | null {
    const content = requestBody.content;
    if (!content) return null;

    if (content['application/json']) {
        const schema = content['application/json'].schema as OpenAPIV3.SchemaObject | undefined;
        return {
            contentTypeHeader: 'Content-Type: application/json',
            bodyText: generateJsonSkeleton(schema),
        };
    }

    if (content['application/x-www-form-urlencoded']) {
        const schema = content['application/x-www-form-urlencoded'].schema as OpenAPIV3.SchemaObject | undefined;
        return {
            contentTypeHeader: 'Content-Type: application/x-www-form-urlencoded',
            bodyText: generateFormSkeleton(schema),
        };
    }

    return null;
}

function generateJsonSkeleton(schema: OpenAPIV3.SchemaObject | undefined): string {
    if (!schema || schema.type !== 'object' || !schema.properties) return '{}';

    const skeleton: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
        skeleton[key] = getPropertyPlaceholderValue(propSchema as OpenAPIV3.SchemaObject, key);
    }
    return JSON.stringify(skeleton, null, 2);
}

function generateFormSkeleton(schema: OpenAPIV3.SchemaObject | undefined): string {
    if (!schema || !schema.properties) return '';

    return Object.entries(schema.properties)
        .map(([key, propSchema]) => {
            const value = getPropertyPlaceholderValue(propSchema as OpenAPIV3.SchemaObject, key);
            return `${key}=${value}`;
        })
        .join('\n');
}

function getPropertyPlaceholderValue(schema: OpenAPIV3.SchemaObject, propName: string): unknown {
    if (schema.example !== undefined) return schema.example;
    switch (schema.type) {
        case 'string': return `<${propName}>`;
        case 'integer':
        case 'number': return 0;
        case 'boolean': return false;
        case 'array': return [];
        case 'object': return {};
        default: return `<${propName}>`;
    }
}

function isParameterObject(p: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject): p is OpenAPIV3.ParameterObject {
    return !('$ref' in p);
}

function isRequestBodyObject(rb: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject): rb is OpenAPIV3.RequestBodyObject {
    return !('$ref' in rb);
}

function schemeToAuthMethod(schemeName: string, scheme: OpenAPIV3.SecuritySchemeObject): AuthMethod | undefined {
    if (scheme.type === 'http') {
        if (scheme.scheme === 'bearer') {
            return { type: 'http', scheme: 'bearer', tokenVariable: `${schemeName.toUpperCase()}_TOKEN` } satisfies HttpBearerAuth
        }
        if (scheme.scheme === 'basic') {
            return {
                type: 'http',
                scheme: 'basic',
                usernameVariable: `${schemeName.toUpperCase()}_USERNAME`,
                passwordVariable: `${schemeName.toUpperCase()}_PASSWORD`,
            } satisfies HttpBasicAuth
        }
    }
    if (scheme.type === 'apiKey') {
        return {
            type: 'apiKey',
            name: scheme.name,
            in: scheme.in as 'header' | 'query' | 'cookie',
            keyVariable: `${schemeName.toUpperCase()}_KEY`,
        } satisfies ApiKeyAuth
    }
    return undefined
}

export function extractGlobalSecurity(doc: OpenAPIV3.Document): SecurityRequirement[] | undefined {
    if (!doc.security?.length || !doc.components?.securitySchemes) return undefined

    const schemes = doc.components.securitySchemes

    const requirements: SecurityRequirement[] = []

    for (const requirementObj of doc.security) {
        const requirement: SecurityRequirement = {}
        for (const [schemeName, _scopes] of Object.entries(requirementObj)) {
            const schemeOrRef = schemes[schemeName]
            if (!schemeOrRef || '$ref' in schemeOrRef) continue
            const authMethod = schemeToAuthMethod(schemeName, schemeOrRef)
            if (authMethod) {
                requirement[schemeName] = authMethod
            }
        }
        if (Object.keys(requirement).length > 0) {
            requirements.push(requirement)
        }
    }

    return requirements.length > 0 ? requirements : undefined
}

export function buildRequestSpec(
    method: string,
    pathPattern: string,
    operation: OpenAPIV3.OperationObject
): RequestSpec {
    const { responses: _r, callbacks: _c, ...rest } = operation
    const op: RequestSpec['operation'] = rest
    // Absent security = inherits folder settings. Present (including []) = operation-level override.
    if (op.security === undefined) {
        delete op.security
    }
    return { method, path: pathPattern, operation: op }
}
