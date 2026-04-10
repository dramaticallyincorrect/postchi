import { readSettingsForRequest, AuthMethod, SecurityRequirement } from '@/postchi/project/project'
import { RequestSpec, REQUEST_SPEC_FILENAME_SUFFIX } from '@/postchi/sources/request-spec'
import DefaultFileStorage from '@/lib/storage/files/file-default'
import * as yaml from 'js-yaml'
import { filenameWithoutExtension } from '@/lib/storage/files/file-utils/file-utils'
import { pathOf } from '@/lib/storage/files/join'
import { parentDir } from '@/lib/storage/files/file-utils/file-utils'
import Task from 'true-myth/task'

/**
 * Resolves the auth headers for a request.
 *
 * Returns zero or more [headerName, headerValue] pairs.
 *
 * Resolution order:
 *  1. If a sibling *.spec.json exists and its operation has an explicit `security` field
 *     (including an empty array = no-auth override), skip folder auth and return [].
 *  2. Otherwise read `settings.json` via path-walking, find the first satisfiable
 *     SecurityRequirement (OR), and apply all its AuthMethods (AND).
 */


export function resolveRequestAuth(
    requestPath: string,
    variables: Map<string, string>,
    fileStorage = DefaultFileStorage.getInstance()
): Task<Array<[string, string]>, string> {
    // 1. Check for per-request spec file override
    return new Task(async (resolve, reject) => {
        const specPath = pathOf(
            parentDir(requestPath),
            filenameWithoutExtension(requestPath) + REQUEST_SPEC_FILENAME_SUFFIX
        )
        try {
            const specContent = await fileStorage.readText(specPath)
            const spec = yaml.load(specContent) as RequestSpec
            //TODO: if template has auth header, skip auth resolution other wise check spec, if spec has auth, resolve it from settings
            if (spec.operation.security !== undefined) {
                // Operation explicitly defines its own security (or opts out with [])
                return resolve([])  // skip folder auth resolution
            }
        } catch {
            // No spec file — proceed to folder settings
        }

        // 2. Read folder security from settings.json
        const settings = await readSettingsForRequest(requestPath)
        if (!settings.security?.length) return resolve([]) 

        // Try each SecurityRequirement in order (OR semantics)
        for (const requirement of settings.security) {
            const headers = resolveRequirement(requirement, variables)
            if (headers !== null) return resolve(headers) 
        }

        return reject('Request requires authentication, but no valid auth was found, check the folder settings');
    })
}

/**
 * Attempts to resolve all AuthMethods in a requirement (AND semantics).
 * Returns the header pairs if all variables are present, null if any is missing.
 */
function resolveRequirement(
    requirement: SecurityRequirement,
    variables: Map<string, string>
): Array<[string, string]> | null {
    const headers: Array<[string, string]> = []

    for (const authMethod of Object.values(requirement)) {
        const header = resolveAuthMethod(authMethod, variables)
        if (header === null) return null  // missing variable — requirement not satisfiable
        if (header) headers.push(header)
    }

    return headers
}

/**
 * Resolves a single AuthMethod to a [headerName, headerValue] pair.
 * Returns null if a required variable is missing (signals unsatisfiable requirement).
 * Returns undefined for auth types that don't produce headers (e.g. apiKey in query/cookie).
 */
function resolveAuthMethod(
    authMethod: AuthMethod,
    variables: Map<string, string>
): [string, string] | null | undefined {
    if (authMethod.type === 'http' && authMethod.scheme === 'bearer') {
        const token = variables.get(authMethod.tokenVariable)
        if (token === undefined) return null
        return ['Authorization', `Bearer ${token}`]
    }

    if (authMethod.type === 'http' && authMethod.scheme === 'basic') {
        const username = variables.get(authMethod.usernameVariable)
        const password = variables.get(authMethod.passwordVariable)
        if (username === undefined || password === undefined) return null
        return ['Authorization', `Basic ${btoa(`${username}:${password}`)}`]
    }

    if (authMethod.type === 'apiKey') {
        if (authMethod.in !== 'header') return undefined  // query/cookie not injected as headers
        const key = variables.get(authMethod.keyVariable)
        if (key === undefined) return null
        return [authMethod.name, key]
    }

    return undefined
}
