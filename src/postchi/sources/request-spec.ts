import { OpenAPIV3 } from 'openapi-types'

export type RequestSpec = {
    method: string                        // e.g. "get"
    path: string                          // e.g. "/pets/{petId}"
    operation: OpenAPIV3.OperationObject  // resolved (no $refs); includes security only if explicitly set on operation
}

// e.g. "List all pets.get" → "List all pets.spec.json"
export const REQUEST_SPEC_FILENAME_SUFFIX = '.spec.json'
