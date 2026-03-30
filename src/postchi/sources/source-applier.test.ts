import { describe, expect, it } from 'vitest'
import { mergeRequestContent } from './source-merger'

describe('mergeRequestContent', () => {

    describe('request line', () => {
        it('uses the new method and URL', () => {
            const old = 'GET https://api.example.com/v1/pets'
            const next = 'GET https://api.example.com/v2/pets'
            expect(mergeRequestContent(old, next)).toBe('GET https://api.example.com/v2/pets')
        })

        it('uses new method when method changes', () => {
            const old = 'GET https://api.example.com/pets'
            const next = 'POST https://api.example.com/pets'
            expect(mergeRequestContent(old, next)).toBe('POST https://api.example.com/pets')
        })
    })

    describe('path parameters', () => {
        it('preserves old path variable value when user filled it in', () => {
            const old = 'GET /pets/123'
            const next = 'GET /pets/<petId>'
            expect(mergeRequestContent(old, next)).toBe('GET /pets/123')
        })

        it('keeps new placeholder when old also has a placeholder', () => {
            const old = 'GET /pets/<petId>'
            const next = 'GET /pets/<petId>'
            expect(mergeRequestContent(old, next)).toBe('GET /pets/<petId>')
        })

        it('uses new structural path segments (non-variable)', () => {
            const old = 'GET /api/v1/pets/123'
            const next = 'GET /api/v2/pets/<petId>'
            expect(mergeRequestContent(old, next)).toBe('GET /api/v2/pets/123')
        })

        it('uses new placeholder when path length increases and old has no segment', () => {
            const old = 'GET /pets/123'
            const next = 'GET /pets/<petId>/details/<detailId>'
            expect(mergeRequestContent(old, next)).toBe('GET /pets/123/details/<detailId>')
        })

        it('uses new path entirely when no path variables in new', () => {
            const old = 'GET /api/v1/pets'
            const next = 'GET /api/v2/pets'
            expect(mergeRequestContent(old, next)).toBe('GET /api/v2/pets')
        })

        it('merges path variables and query params together', () => {
            const old = 'GET /pets/123?status=available'
            const next = 'GET /pets/<petId>?status=<status>&limit=<limit>'
            expect(mergeRequestContent(old, next)).toBe('GET /pets/123?status=available&limit=<limit>')
        })
    })

    describe('query parameters', () => {
        
        it('preserves old query param values', () => {
            const old = 'GET https://api.example.com/pets?status=available'
            const next = 'GET https://api.example.com/pets?status=<status>'
            expect(mergeRequestContent(old, next)).toBe('GET https://api.example.com/pets?status=available')
        })

        it('preserves old values and adds new params from spec', () => {
            const old = 'GET https://api.example.com/pets?status=available'
            const next = 'GET https://api.example.com/pets?status=<status>&limit=<limit>'
            expect(mergeRequestContent(old, next)).toBe('GET https://api.example.com/pets?status=available&limit=<limit>')
        })

        it('drops old params removed from spec', () => {
            const old = 'GET https://api.example.com/pets?status=available&deprecated=true'
            const next = 'GET https://api.example.com/pets?status=<status>'
            expect(mergeRequestContent(old, next)).toBe('GET https://api.example.com/pets?status=available')
        })

        it('uses new placeholder when param is new and old has no value', () => {
            const old = 'GET https://api.example.com/pets'
            const next = 'GET https://api.example.com/pets?status=<status>'
            expect(mergeRequestContent(old, next)).toBe('GET https://api.example.com/pets?status=<status>')
        })
    })

    describe('headers', () => {
        it('preserves old header value when key matches', () => {
            const old = 'GET https://api.example.com/pets\nAuthorization: bearer(my-secret-token)'
            const next = 'GET https://api.example.com/pets\nAuthorization: bearer(<token>)'
            expect(mergeRequestContent(old, next)).toBe(
                'GET https://api.example.com/pets\nAuthorization: bearer(my-secret-token)'
            )
        })

        it('header key matching is case-insensitive', () => {
            const old = 'GET https://api.example.com/pets\nauthorization: bearer(my-token)'
            const next = 'GET https://api.example.com/pets\nAuthorization: bearer(<token>)'
            expect(mergeRequestContent(old, next)).toBe(
                'GET https://api.example.com/pets\nAuthorization: bearer(my-token)'
            )
        })

        it('adds new headers from spec that are not in old', () => {
            const old = 'GET https://api.example.com/pets\nAuthorization: bearer(my-token)'
            const next = 'GET https://api.example.com/pets\nAuthorization: bearer(<token>)\nX-Api-Version: 2'
            expect(mergeRequestContent(old, next)).toBe(
                'GET https://api.example.com/pets\nAuthorization: bearer(my-token)\nX-Api-Version: 2'
            )
        })

        it('keeps user-added headers not present in new spec', () => {
            const old = 'GET https://api.example.com/pets\nAuthorization: bearer(my-token)\nX-Custom-Header: my-value'
            const next = 'GET https://api.example.com/pets\nAuthorization: bearer(<token>)'
            expect(mergeRequestContent(old, next)).toBe(
                'GET https://api.example.com/pets\nAuthorization: bearer(my-token)\nX-Custom-Header: my-value'
            )
        })

        it('handles no headers in either side', () => {
            const old = 'GET https://api.example.com/pets'
            const next = 'GET https://api.example.com/pets'
            expect(mergeRequestContent(old, next)).toBe('GET https://api.example.com/pets')
        })
    })

    describe('JSON body', () => {
        it('preserves old JSON leaf values where keys match', () => {
            const old = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "Fluffy", "status": "available"}'
            ].join('\n')

            const next = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "<name>", "status": "<status>"}'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            const body = JSON.parse(result.split('@body\n')[1])
            expect(body).toEqual({ name: 'Fluffy', status: 'available' })
        })

        it('adds new fields from spec not present in old body', () => {
            const old = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "Fluffy"}'
            ].join('\n')

            const next = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "<name>", "category": "<category>"}'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            const body = JSON.parse(result.split('@body\n')[1])
            expect(body).toEqual({ name: 'Fluffy', category: '<category>' })
        })

        it('drops removed fields not in new spec', () => {
            const old = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "Fluffy", "deprecated": "true"}'
            ].join('\n')

            const next = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "<name>"}'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            const body = JSON.parse(result.split('@body\n')[1])
            expect(body).toEqual({ name: 'Fluffy' })
        })

        it('preserves nested object values', () => {
            const old = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"pet": {"name": "Fluffy", "age": 3}}'
            ].join('\n')

            const next = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"pet": {"name": "<name>", "age": "<age>"}}'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            const body = JSON.parse(result.split('@body\n')[1])
            expect(body).toEqual({ pet: { name: 'Fluffy', age: 3 } })
        })

        it('falls back to new body when old body is invalid JSON', () => {
            const old = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                'not valid json'
            ].join('\n')

            const next = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "<name>"}'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            expect(result).toContain('"name": "<name>"')
        })
    })

    describe('form body', () => {
        it('preserves old form entry values', () => {
            const old = [
                'POST https://api.example.com/login',
                'Content-Type: application/x-www-form-urlencoded',
                '@body',
                'username=john\npassword=secret'
            ].join('\n')

            const next = [
                'POST https://api.example.com/login',
                'Content-Type: application/x-www-form-urlencoded',
                '@body',
                'username=<username>\npassword=<password>'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            const bodyPart = result.split('@body\n')[1]
            expect(bodyPart).toContain('username=john')
            expect(bodyPart).toContain('password=secret')
        })

        it('adds new form entries from spec', () => {
            const old = [
                'POST https://api.example.com/login',
                'Content-Type: application/x-www-form-urlencoded',
                '@body',
                'username=john'
            ].join('\n')

            const next = [
                'POST https://api.example.com/login',
                'Content-Type: application/x-www-form-urlencoded',
                '@body',
                'username=<username>\nremember=<remember>'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            const bodyPart = result.split('@body\n')[1]
            expect(bodyPart).toContain('username=john')
            expect(bodyPart).toContain('remember=<remember>')
        })
    })

    describe('body type changes', () => {
        it('uses new body verbatim when body type changes', () => {
            const old = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "Fluffy"}'
            ].join('\n')

            const next = [
                'POST https://api.example.com/pets',
                'Content-Type: application/x-www-form-urlencoded',
                '@body',
                'name=<name>'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            expect(result).toContain('name=<name>')
            expect(result).not.toContain('Fluffy')
        })

        it('uses new body when old had no body', () => {
            const old = 'GET https://api.example.com/pets'
            const next = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "<name>"}'
            ].join('\n')

            const result = mergeRequestContent(old, next)
            expect(result).toContain('@body')
            expect(result).toContain('"name": "<name>"')
        })

        it('produces no body section when new has no body', () => {
            const old = [
                'POST https://api.example.com/pets',
                'Content-Type: application/json',
                '@body',
                '{"name": "Fluffy"}'
            ].join('\n')

            const next = 'GET https://api.example.com/pets'

            const result = mergeRequestContent(old, next)
            expect(result).not.toContain('@body')
            expect(result).not.toContain('Fluffy')
        })
    })

    describe('combined scenarios', () => {
        it('merges headers, query params, and JSON body together', () => {
            const old = [
                'GET https://api.example.com/pets?status=available&limit=20',
                'Authorization: bearer(my-secret)',
                'X-Custom: keep-me',
                '@body',
                '{"filter": "dogs"}'
            ].join('\n')

            // new spec: changed query param (drops limit, adds page), added Accept header, body gets new field
            const next = [
                'GET https://api.example.com/pets?status=<status>&page=<page>',
                'Authorization: bearer(<token>)',
                'Accept: application/json',
                '@body',
                '{"filter": "<filter>", "sort": "<sort>"}'
            ].join('\n')

            const result = mergeRequestContent(old, next)

            expect(result).toContain('status=available')   // old query param value preserved
            expect(result).toContain('page=<page>')        // new query param added
            expect(result).not.toContain('limit=')         // removed from spec
            expect(result).toContain('Authorization: bearer(my-secret)')  // old header value
            expect(result).toContain('Accept: application/json')          // new spec header
            expect(result).toContain('X-Custom: keep-me')                 // user-added header

            const bodyPart = result.split('@body\n')[1]
            const body = JSON.parse(bodyPart)
            expect(body.filter).toBe('dogs')       // old value
            expect(body.sort).toBe('<sort>')        // new field from spec
        })
    })
})
