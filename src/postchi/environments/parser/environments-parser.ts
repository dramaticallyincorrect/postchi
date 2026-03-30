import { parser } from "./parser"
import { sliceInput } from "@/lib/utils/doc"


export default function parseEnvironments(text: string): Environment[] {
    const tree = parser.parse(text)

    const envs: Environment[] = []
    tree.cursor().iterate((node) => {
        if (node.node.name === 'Environment') {
            const nameNode = node.node.getChild('EnvironmentName')
            const entries = node.node.getChildren('Entry')
            const variables = entries.map(entry => {
                const keyNode = entry.getChild('Key')
                const valueNode = entry.getChild('Value')
                return {
                    key: sliceInput(text, keyNode!.from, keyNode!.to).trim(),
                    value: valueNode ? sliceInput(text, valueNode.from, valueNode.to).trim() : ''
                }
            }).filter(variable => variable.value.length > 0)
            envs.push({
                name: nameNode ? sliceInput(text, nameNode.from, nameNode.to).trim() : 'Unnamed Environment',
                variables
            })
        }
    })

    return envs
}

export type Environment = {
    name: string,
    variables: { key: string, value: string }[]
}