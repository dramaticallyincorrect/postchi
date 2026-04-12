import { describe, expect, it } from 'vitest'
import { walkSchema } from './open-api-inspector'
import { OpenAPIV3 } from 'openapi-types'

const schema: OpenAPIV3.SchemaObject = {
    type: 'object',
    required: ['status'],
    properties: {
        status: { type: 'string', enum: ['active', 'inactive'] },
        user: {
            type: 'object',
            required: ['name'],
            properties: {
                name: { type: 'string' },
                age:  { type: 'integer' },
            },
        },
    },
}

describe('walkSchema', () => {
    it('resolves constraints at every level of a nested schema', () => {
        expect(walkSchema(schema, [])).toEqual({
            type: 'object', properties: ['status', 'user'], required: ['status'], enum: undefined,
        })
        expect(walkSchema(schema, ['status'])).toEqual({
            type: 'string', properties: undefined, required: undefined, enum: ['active', 'inactive'],
        })
        expect(walkSchema(schema, ['user'])).toEqual({
            type: 'object', properties: ['name', 'age'], required: ['name'], enum: undefined,
        })
        expect(walkSchema(schema, ['user', 'age'])).toEqual({
            type: 'integer', properties: undefined, required: undefined, enum: undefined,
        })
        expect(walkSchema(schema, ['doesNotExist'])).toBeNull()
    })
})
