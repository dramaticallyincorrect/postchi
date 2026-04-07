import jsYaml from 'js-yaml';
import { createHttpClient } from '../../network/http/http-client-factory';
import { HttpRequest } from '../../network/http/http-client';
import { Task } from 'true-myth/task';

export function isGitLabUrl(url: string): boolean {
    try {
        const { hostname } = new URL(url)
        return hostname === 'gitlab.com' || hostname.includes('gitlab')
    } catch {
        return false
    }
}

/**
 * Converts a GitLab browse or raw URL to the GitLab Repository Files API endpoint.
 *
 * Handles URLs of the form:
 *   https://gitlab.com/{namespace}/{project}/-/blob/{ref}/{filepath}
 *   https://gitlab.com/{namespace}/{project}/-/raw/{ref}/{filepath}
 *
 * Produces:
 *   https://gitlab.com/api/v4/projects/{encoded_path}/repository/files/{encoded_filepath}/raw?ref={ref}
 *
 * If the URL doesn't match the expected pattern (e.g. already an API URL), it is returned as-is.
 */
export function toGitLabApiUrl(url: string): string {
    const parsed = new URL(url)
    const pathname = parsed.pathname

    // Already an API URL — pass through
    if (pathname.startsWith('/api/v4/')) return url

    // Find the /-/ separator GitLab uses between project path and action
    const separatorIdx = pathname.indexOf('/-/')
    if (separatorIdx === -1) return url

    const projectPath = pathname.slice(1, separatorIdx)     // strip leading /
    const rest = pathname.slice(separatorIdx + 3)            // skip /-/

    // rest: "{action}/{ref}/{...filepath}"  e.g. "blob/main/docs/openapi.yaml"
    const slashAfterAction = rest.indexOf('/')
    if (slashAfterAction === -1) return url
    const afterAction = rest.slice(slashAfterAction + 1)     // "{ref}/{...filepath}"

    const slashAfterRef = afterAction.indexOf('/')
    if (slashAfterRef === -1) return url
    const ref = afterAction.slice(0, slashAfterRef)
    const filePath = afterAction.slice(slashAfterRef + 1)

    const encodedProject = encodeURIComponent(projectPath)
    const encodedFilePath = encodeURIComponent(filePath)

    return `${parsed.origin}/api/v4/projects/${encodedProject}/repository/files/${encodedFilePath}/raw?ref=${encodeURIComponent(ref)}`
}

type FetchError = {
    message: string,
    status: number
}

export function fetchWithGitLabAuth(url: string, token: string | undefined): Task<unknown, FetchError> {
    return new Task(async (ok, err) => {
        const client = createHttpClient()
        const request: HttpRequest = {
            method: 'GET',
            url: toGitLabApiUrl(url),
            headers: token ? [['PRIVATE-TOKEN', token]] : [],
            body: '',
        }

        const result = await client.fetch(request, new AbortController().signal)

        if (result.isErr) {
            return err({
                message: `Failed to fetch spec: ${result.error.message}`,
                status: 0
            })
        }

        const response = result.value

        if (response.status === 401) {
            return err({
                message: 'GitLab authentication failed — check your token',
                status: response.status
            })
        }
        if (response.status === 404) {
            return err({
                message: 'Spec not found at that URL',
                status: response.status
            })
        }
        if (response.status < 200 || response.status >= 300) {
            return err({
                message: `Failed to fetch spec: ${response.status}`,
                status: response.status
            })
        }

        const text = typeof response.body === 'string'
            ? response.body
            : new TextDecoder().decode(response.body)

        try {
            return ok(JSON.parse(text))
        } catch {
            try {
                return ok(jsYaml.load(text))
            } catch {
                return err({
                    message: 'Failed to parse spec',
                    status: 0
                })
            }
        }
    })
}

async function fetchGithubFile(url: string): Promise<unknown> {
    const parsed = new URL(url)
    const pathname = parsed.pathname

    // Convert github.com browse URL to API URL
    // https://github.com/{owner}/{repo}/blob/{branch}/{filepath} -> https://api.github.com/repos/{owner}/{repo}/contents/{filepath}?ref={branch}
    const match = pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/)
    if (!match) return url

    const [, owner, repo, branch, filepath] = match
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filepath}?ref=${branch}`

    const client = createHttpClient()
    const request: HttpRequest = {
        method: 'GET',
        url: apiUrl,
        headers: [['Accept', 'application/vnd.github.v3.raw']],
        body: '',
    }

    const result = await client.fetch(request, new AbortController().signal)

    if (result.isErr) {
        throw new Error(`Failed to fetch spec: ${result.error.message}`)
    }

    const response = result.value

    if (response.status === 401) {
        throw new Error('authentication failed — check your token')
    }
    if (response.status === 404) {
        throw new Error('Spec not found at that URL')
    }
    if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to fetch spec: ${response.status}`)
    }

    const text = typeof response.body === 'string'
        ? response.body
        : new TextDecoder().decode(response.body)

    try {
        return JSON.parse(text)
    } catch {
        return jsYaml.load(text)
    }
}


export async function fetchSpec(url: string): Promise<unknown> {
    const client = createHttpClient()
    const headers: [string, string][] = []
    if (url.includes('github.com')) {
        return await fetchGithubFile(url)
    }
    const request: HttpRequest = {
        method: 'GET',
        url: url,
        headers: headers,
        body: '',
    }

    const result = await client.fetch(request, new AbortController().signal)

    if (result.isErr) {
        throw new Error(`Failed to fetch spec: ${result.error.message}`)
    }

    const response = result.value

    if (response.status === 401) {
        throw new Error('authentication failed — check your token')
    }
    if (response.status === 404) {
        throw new Error('Spec not found at that URL')
    }
    if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to fetch spec: ${response.status}`)
    }

    const text = typeof response.body === 'string'
        ? response.body
        : new TextDecoder().decode(response.body)

    try {
        return JSON.parse(text)
    } catch {
        return jsYaml.load(text)
    }
}
