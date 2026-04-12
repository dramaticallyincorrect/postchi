import { OpenAPIV3 } from "openapi-types"

type SchemaType = OpenAPIV3.NonArraySchemaObjectType | OpenAPIV3.ArraySchemaObjectType

/** The resolved constraints at a specific path within an OpenAPI schema. */
export type SchemaNode = {
    /** The JSON type of this node. */
    type:       SchemaType | undefined
    /** Valid values for this node, if the schema restricts it to a fixed set. */
    enum:       (string | number | boolean | null)[] | undefined
    /** Names of valid child keys, populated when this node is an object. */
    properties: string[] | undefined
    /** Child keys that must be present, populated when this node is an object. */
    required:   string[] | undefined
}

/**
 * Resolves the schema constraints at a given path within an OpenAPI schema object.
 *
 * Assumes the schema has already been fully dereferenced (no `$ref` nodes).
 * `allOf` sub-schemas are merged at each level before descending.
 *
 * Returns `null` if the path does not exist in the schema.
 *
 * @example
 * walkSchema(schema, [])              // constraints at the root
 * walkSchema(schema, ["status"])      // constraints for the "status" field
 * walkSchema(schema, ["user", "age"]) // constraints for a nested field
 */
export function walkSchema(
    schema: OpenAPIV3.SchemaObject,
    path: string[]
): SchemaNode | null {
    const resolved = mergeAllOf(schema)

    if (path.length === 0) {
        return {
            type:       resolved.type,
            enum:       resolved.enum,
            properties: resolved.properties ? Object.keys(resolved.properties) : undefined,
            required:   resolved.required,
        }
    }

    const [head, ...tail] = path
    const next = resolved.properties?.[head]
    if (!next || '$ref' in next) return null

    return walkSchema(next, tail)
}

function mergeAllOf(schema: OpenAPIV3.SchemaObject): OpenAPIV3.SchemaObject {
    if (!schema.allOf || schema.allOf.length === 0) return schema

    const subSchemas = schema.allOf.filter((s): s is OpenAPIV3.SchemaObject => !('$ref' in s))

    const mergedProperties = subSchemas.reduce<Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>>(
        (acc, s) => ({ ...acc, ...s.properties }),
        { ...schema.properties }
    )

    const mergedRequired = [
        ...(schema.required ?? []),
        ...subSchemas.flatMap(s => s.required ?? [])
    ].filter((v, i, arr) => arr.indexOf(v) === i)

    return {
        ...schema,
        properties: mergedProperties,
        required:   mergedRequired.length > 0 ? mergedRequired : undefined,
    }
}
