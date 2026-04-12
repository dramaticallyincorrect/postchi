import { OpenAPIV3 } from "openapi-types";

export function isQueryParameter(p: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject): boolean {
    return !('$ref' in p) && p.in === 'query'
}

export function getOperationParamters(operation: OpenAPIV3.OperationObject, requiredOnly: boolean = false): OpenAPIV3.ParameterObject[] {
    return operation.parameters?.filter((p): p is OpenAPIV3.ParameterObject => {
        return !('$ref' in p) && p.in === 'query' && (!requiredOnly || p.required == true)
    }) ?? []
}

export type ParameterSchemaLocation = 'query' | 'header'


export function getOperationEnumsFor(
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

    if ('items' in param.schema) {
        return (param.schema.items as OpenAPIV3.SchemaObject).enum
    }

    const schema = param.schema as OpenAPIV3.SchemaObject;

    return schema.enum;
}

export function getParameterEnums(param: OpenAPIV3.ParameterObject): any[] | undefined {
    if (!param) return []
    if (param.schema && 'items' in param.schema) {
        return (param.schema.items as OpenAPIV3.SchemaObject).enum
    }

    const schema = param.schema as OpenAPIV3.SchemaObject;

    return schema.enum;
}