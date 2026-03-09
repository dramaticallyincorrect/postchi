
export function getVariableName(variable: string) {
    return variable.slice(1, -1)
}

export function isVariable(variable: string) {
    return variable.startsWith("<") && variable.endsWith(">")
}

export function asVariable(name: string) {
    return `<${name}>`
}