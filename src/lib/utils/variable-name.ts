
export function getVariableName(variable: string) {
    return variable.replace(/<|>/g, "")
}

export function isVariable(variable: string) {
    return variable.startsWith("<") && variable.endsWith(">")
}

export function asVariable(name: string) {
    return `<${name}>`
}