import DefaultFileStorage from "@/lib/data/files/file-default"

type HttpFunction = {
    parameters: string[],
    isVarArgs: boolean,
    execute: (args: string[]) => Promise<string>
}

export const httpFunctions: Map<string, HttpFunction> = new Map([
    ['readText', {
        parameters: ['path'],
        isVarArgs: false,
        execute: async (args: string[]) => {
            const path = args[0]
            const fileStorage = new DefaultFileStorage()
            return fileStorage.readText(path)
        }
    }],
    ['bearer', {
        parameters: ['token'],
        isVarArgs: false,
        execute: async (args: string[]) => {
            const token = args[0]
            return `Bearer ${token}`
        }
    }],
    ['join', {
        parameters: ['parts'],
        isVarArgs: true,
        execute: async (args: string[]) => {
            return args.join('')
        }
    }],
    ['basicAuth', {
        parameters: ['username', 'password'],
        isVarArgs: false,
        execute: async (args: string[]) => {
            const username = args[0]
            const password = args[1]
            return `Basic ${btoa(`${username}:${password}`)}`
        }
    }]
])

export const readFileFunction: HttpFunction = {
    parameters: ['path'],
    isVarArgs: false,
    execute: async (args: string[]) => {
        throw new Error("readFile, only here to be recognized by the linter, should not be executed")
    }
}

export default httpFunctions