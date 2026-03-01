
export function getVariableName(variable: string) {
    return variable.replace(/<|>/g, "")
}

export function isVariable(variable: string) {
    return variable.startsWith("<") && variable.endsWith(">")
}