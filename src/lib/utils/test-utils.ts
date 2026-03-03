export const whitespaces = [' ', '  ', '   ', '\t', ' \t\t']
export const newlines = ['\n', '\n\n', '\n\n\n']

export function endOf(str: string, search: string): number {
    return str.indexOf(search) + search.length
}