export type BinaryType = 'image' | 'video' | 'audio' | 'pdf' | 'binary';
export type TextType = 'json' | 'html' | 'xml' | 'csv' | 'markdown' | 'text';

export interface BinaryContent {
    kind: 'binary';
    type: BinaryType;
    mimeType: string;
}

export interface TextContent {
    kind: 'text';
    type: TextType;
    mimeType: string;
    parseable: boolean;
}

export type ContentTypeInfo = BinaryContent | TextContent;

const BINARY_MIMES = new Set<string>([
    'application/octet-stream',
    'application/zip',
    'application/x-zip-compressed',
    'application/gzip',
    'application/x-tar',
    'application/x-7z-compressed',
    'application/vnd.rar',
    'application/x-bzip2',
    'application/wasm',
    'application/x-msdownload',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
]);


/**
 * Analyzes a fetch Response and returns metadata about the body content type.
 */
export async function classifyResponseBody(response: Response): Promise<ContentTypeInfo> {
    const raw = response.headers.get('content-type') ?? '';
    const mimeType = raw.split(';')[0].trim().toLowerCase();

    const fromMime = classifyMimeType(mimeType);
    if (fromMime) return fromMime;

    const buffer = await response.clone().arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (looksLikeBinary(bytes)) {
        return { kind: 'binary', type: 'binary', mimeType: mimeType || 'application/octet-stream' };
    }

    return classifyText(new TextDecoder().decode(bytes));
}


/**
 * Classifies a normalised MIME type string (lowercase, no parameters).
 * Returns `null` when the MIME type is unknown — caller should sniff bytes.
 */
export function classifyMimeType(mimeType: string): ContentTypeInfo | null {
    if (mimeType.startsWith('image/')) return { kind: 'binary', type: 'image', mimeType };
    if (mimeType.startsWith('video/')) return { kind: 'binary', type: 'video', mimeType };
    if (mimeType.startsWith('audio/')) return { kind: 'binary', type: 'audio', mimeType };
    if (mimeType === 'application/pdf') return { kind: 'binary', type: 'pdf', mimeType };

    if (BINARY_MIMES.has(mimeType)) return { kind: 'binary', type: 'binary', mimeType };

    if (
        mimeType === 'application/json' ||
        mimeType === 'application/ld+json' ||
        mimeType.endsWith('+json')
    ) return { kind: 'text', type: 'json', mimeType, parseable: true };

    if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml')
        return { kind: 'text', type: 'html', mimeType, parseable: false };

    if (
        mimeType === 'text/xml' ||
        mimeType === 'application/xml' ||
        mimeType.endsWith('+xml')
    ) return { kind: 'text', type: 'xml', mimeType, parseable: true };

    if (mimeType === 'text/csv' || mimeType === 'application/csv')
        return { kind: 'text', type: 'csv', mimeType, parseable: true };

    if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown')
        return { kind: 'text', type: 'markdown', mimeType, parseable: false };

    if (mimeType.startsWith('text/'))
        return { kind: 'text', type: 'text', mimeType, parseable: false };

    return null;
}

/**
 * Classifies raw text content by sniffing its structure.
 */
export function classifyText(text: string): TextContent {
    const trimmed = text.trimStart();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            JSON.parse(trimmed);
            return { kind: 'text', type: 'json', mimeType: 'application/json', parseable: true };
        } catch {
            // fall through
        }
    }

    if (/^<(!DOCTYPE\s+html|html)/i.test(trimmed))
        return { kind: 'text', type: 'html', mimeType: 'text/html', parseable: false };

    if (/^<\?xml/i.test(trimmed) || /^<[a-z]/i.test(trimmed))
        return { kind: 'text', type: 'xml', mimeType: 'text/xml', parseable: true };

    return { kind: 'text', type: 'text', mimeType: 'text/plain', parseable: false };
}

/**
 * Returns true when the byte sample contains enough non-printable bytes
 * to be considered binary (same heuristic used by git / file(1)).
 */
export function looksLikeBinary(bytes: Uint8Array, sampleSize = 8000): boolean {
    const end = Math.min(bytes.length, sampleSize);
    let nonText = 0;
    for (let i = 0; i < end; i++) {
        const b = bytes[i];
        if (b === 0 || b < 0x08 || (b >= 0x0e && b <= 0x1f && b !== 0x1b)) {
            nonText++;
        }
    }
    return nonText / end > 0.01;
}