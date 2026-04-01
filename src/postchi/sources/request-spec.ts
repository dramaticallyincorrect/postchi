import { OpenAPIV3 } from 'openapi-types'

export type RequestSpec = {
    method: string
    path: string
    operation: Omit<OpenAPIV3.OperationObject, 'responses' | 'callbacks'>
}

// e.g. "List all pets.get" → "List all pets.spec.yaml"
export const REQUEST_SPEC_FILENAME_SUFFIX = '.spec.yaml'
