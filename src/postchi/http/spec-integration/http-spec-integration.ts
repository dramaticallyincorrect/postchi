import { buildRequestText } from "@/postchi/import/open-api/open-api-parser";
import { RequestSpec } from "@/postchi/sources/request-spec";
import { mergeRequestContent } from "@/postchi/sources/source-merger";

export function collapseHttpRequest(spec: RequestSpec): string {
    // TODO: check with optional body
    return buildRequestText({
        pathPattern: spec.path,
        method: spec.method,
        operation: {
            ...spec.operation,
            responses: {}
        },
        pathLevelParams: [],
        securitySchemes: {}
    }, false);
}

export function expandHttpRequest(request: string, spec: RequestSpec): string {
    const newText = buildRequestText({
        pathPattern: spec.path,
        method: spec.method,
        operation: {
            ...spec.operation,
            responses: {}
        },
        pathLevelParams: [],
        securitySchemes: {}
    }, true);

    return mergeRequestContent(request, newText)
}