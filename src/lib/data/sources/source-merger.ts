import { computeHttpAst } from '../../http/parser/http-ast'

export function mergeRequestContent(oldContent: string, newContent: string): string {
    const oldAst = computeHttpAst(oldContent)
    const newAst = computeHttpAst(newContent)

    // --- Request line (method + URL) ---
    const newMethod = newContent.slice(newAst.method.from, newAst.method.to)
    const newUrlText = newAst.url.length > 0
        ? newContent.slice(newAst.url[0].from, newAst.url[newAst.url.length - 1].to)
        : ''

    const mergedUrl = mergeUrl(
        oldAst.url.length > 0
            ? oldContent.slice(oldAst.url[0].from, oldAst.url[oldAst.url.length - 1].to)
            : '',
        newUrlText
    )

    const mergedRequestLine = `${newMethod} ${mergedUrl}`

    // --- Headers ---
    const oldHeaderMap = new Map<string, string>()
    for (const h of oldAst.headers) {
        const key = oldContent.slice(h.key.from, h.key.to).toLowerCase()
        const value = oldContent.slice(h.value.from, h.value.to)
        oldHeaderMap.set(key, value)
    }

    const newHeaderKeys = new Set<string>()
    const mergedHeaderLines: string[] = []

    for (const h of newAst.headers) {
        const key = newContent.slice(h.key.from, h.key.to)
        const lowerKey = key.toLowerCase()
        newHeaderKeys.add(lowerKey)
        const oldValue = oldHeaderMap.get(lowerKey)
        if (oldValue !== undefined) {
            mergedHeaderLines.push(`${key}: ${oldValue}`)
        } else {
            mergedHeaderLines.push(newContent.slice(h.from, h.to))
        }
    }

    // Append user-added old headers not present in new
    for (const h of oldAst.headers) {
        const lowerKey = oldContent.slice(h.key.from, h.key.to).toLowerCase()
        if (!newHeaderKeys.has(lowerKey)) {
            mergedHeaderLines.push(oldContent.slice(h.from, h.to))
        }
    }

    // --- Body ---
    let mergedBody: string | null = null

    if (newAst.body !== null) {
        const newBodyText = newContent.slice(newAst.body.from, newAst.body.to)

        if (oldAst.body !== null && oldAst.body.type === newAst.body.type) {
            const oldBodyText = oldContent.slice(oldAst.body.from, oldAst.body.to)

            if (newAst.body.type === 'json') {
                mergedBody = mergeJsonBody(oldBodyText, newBodyText)
            } else if (newAst.body.type === 'urlencoded' || newAst.body.type === 'multipart') {
                mergedBody = mergeFormBody(oldBodyText, newBodyText)
            } else {
                mergedBody = newBodyText
            }
        } else {
            mergedBody = newBodyText
        }
    }

    // --- Reconstruct ---
    const parts: string[] = [mergedRequestLine]
    if (mergedHeaderLines.length > 0) {
        parts.push(mergedHeaderLines.join('\n'))
    }
    if (mergedBody !== null) {
        parts.push('@body')
        parts.push(mergedBody)
    }

    return parts.join('\n')
}

function mergeUrl(oldUrl: string, newUrl: string): string {
    const [newBase, newQuery] = splitUrl(newUrl)
    const [oldBase, oldQuery] = splitUrl(oldUrl)

    const mergedBase = mergePath(oldBase, newBase)

    if (!newQuery) return mergedBase

    const oldParams = parseQueryParams(oldQuery ?? '')
    const newParams = parseQueryParams(newQuery)
    const mergedPairs = newParams.map(([k, v]) => {
        const oldVal = oldParams.find(([ok]) => ok === k)?.[1]
        return `${k}=${oldVal ?? v}`
    })

    return `${mergedBase}?${mergedPairs.join('&')}`
}

function mergePath(oldPath: string, newPath: string): string {
    const oldSegments = oldPath.split('/')
    const newSegments = newPath.split('/')

    return newSegments.map((newSeg, i) => {
        if (isPathVariable(newSeg)) {
            const oldSeg = oldSegments[i]
            // Only substitute if user filled in a literal (non-variable) value
            if (oldSeg !== undefined && oldSeg !== '' && !isPathVariable(oldSeg)) {
                return oldSeg
            }
        }
        return newSeg
    }).join('/')
}

function isPathVariable(segment: string): boolean {
    return segment.startsWith('<') && segment.endsWith('>')
}

function splitUrl(url: string): [string, string | undefined] {
    const idx = url.indexOf('?')
    if (idx === -1) return [url, undefined]
    return [url.slice(0, idx), url.slice(idx + 1)]
}

function parseQueryParams(query: string): [string, string][] {
    if (!query) return []
    return query.split('&').map(pair => {
        const idx = pair.indexOf('=')
        if (idx === -1) return [pair, ''] as [string, string]
        return [pair.slice(0, idx), pair.slice(idx + 1)] as [string, string]
    })
}

function mergeJsonBody(oldBodyText: string, newBodyText: string): string {
    try {
        const oldJson = JSON.parse(oldBodyText)
        const newJson = JSON.parse(newBodyText)
        const merged = deepMergeJsonValues(newJson, oldJson)
        return JSON.stringify(merged, null, 2)
    } catch {
        return newBodyText
    }
}

function deepMergeJsonValues(newVal: unknown, oldVal: unknown): unknown {
    if (typeof newVal !== 'object' || newVal === null || Array.isArray(newVal)) {
        return oldVal !== undefined ? oldVal : newVal
    }
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(newVal as object)) {
        result[key] = deepMergeJsonValues(
            (newVal as Record<string, unknown>)[key],
            (oldVal as Record<string, unknown>)?.[key]
        )
    }
    return result
}

function mergeFormBody(oldBodyText: string, newBodyText: string): string {
    const oldEntries = parseFormEntries(oldBodyText)
    const newEntries = parseFormEntries(newBodyText)

    const mergedLines = newEntries.map(([k, v]) => {
        const oldVal = oldEntries.find(([ok]) => ok === k)?.[1]
        return `${k}=${oldVal ?? v}`
    })

    return mergedLines.join('\n')
}

function parseFormEntries(text: string): [string, string][] {
    return text.split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const idx = line.indexOf('=')
            if (idx === -1) return [line, ''] as [string, string]
            return [line.slice(0, idx), line.slice(idx + 1)] as [string, string]
        })
}
