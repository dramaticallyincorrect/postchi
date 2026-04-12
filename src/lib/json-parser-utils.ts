import { SyntaxNode } from "@lezer/common"

/**
 * The structural location of the cursor within a JSON document.
 *
 * - `key`   — cursor is inside or between object key strings at `path` depth.
 *             `existingKeys` lists sibling keys already present so completions
 *             can exclude them.
 * - `value` — cursor is inside the value at `path` (e.g. typing an enum value).
 */
export type CursorLocation =
    | { role: 'key';   path: string[]; existingKeys: string[] }
    | { role: 'value'; path: string[] }
    | null

/**
 * Resolves the structural location of the cursor within a JSON document using
 * a Lezer `SyntaxNode` — the error-tolerant CodeMirror parser — so completions
 * work even when the JSON body is mid-edit and not yet valid.
 *
 * `node` should be `jsonTree.resolveInner(cursorPos, -1)`.
 * `doc` is the full document string, used to extract key text from nodes.
 *
 * Returns `null` when no meaningful completion location can be determined
 * (e.g. cursor is inside an array or outside the JSON body entirely).
 *
 * @example
 * const tree = json().language.parser.parse(doc)
 * const node = tree.resolveInner(cursorPos, -1)
 * pathAtPosition(node, doc)  // → { role: 'value', path: ['status'] }
 */
export function pathAtPosition(node: SyntaxNode, doc: string): CursorLocation {
    if (node.name === 'PropertyName') {
        const parentObject = node.parent?.parent   // PropertyName → Property → Object
        const currentKey = propertyNameText(node, doc)
        const existingKeys = parentObject?.name === 'Object'
            ? objectKeys(parentObject, doc).filter(k => k !== currentKey)
            : []
        return { role: 'key', path: ancestorPath(node.parent?.parent ?? null, doc), existingKeys }
    }

    if (node.name === 'Object') {
        return { role: 'key', path: ancestorPath(node.parent ?? null, doc), existingKeys: objectKeys(node, doc) }
    }

    if (node.name === 'Array' || node.name === 'JsonText') {
        return null
    }

    return { role: 'value', path: ancestorPath(node.parent ?? null, doc) }
}

function propertyNameText(node: SyntaxNode, doc: string): string {
    return doc.slice(node.from + 1, node.to - 1)
}

function objectKeys(objectNode: SyntaxNode, doc: string): string[] {
    return objectNode.getChildren('Property')
        .flatMap(p => {
            const name = p.getChild('PropertyName')
            return name ? [propertyNameText(name, doc)] : []
        })
}

/** Walks up the tree from `node`, collecting the key name of every ancestor Property. */
function ancestorPath(node: SyntaxNode | null, doc: string): string[] {
    const path: string[] = []
    let current = node

    while (current) {
        if (current.name === 'Property') {
            const nameNode = current.getChild('PropertyName')
            if (nameNode) path.unshift(propertyNameText(nameNode, doc))
        }
        current = current.parent
    }

    return path
}
