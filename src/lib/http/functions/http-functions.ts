import DefaultFileStorage from "@/lib/data/files/file-default"

type HttpFunction = {
    parameters: string[],
    execute: (args: string[]) => Promise<string>
}

export const httpFunctions: Map<string, HttpFunction> = new Map([
    ['readText', {
        parameters: ['path'],
        execute: async (args: string[]) => {
            const path = args[0]
            const fileStorage = new DefaultFileStorage()
            return fileStorage.readText(path)
        }
    }],
    ['bearer', {
        parameters: ['token'],
        execute: async (args: string[]) => {
            const token = args[0]
            return `Bearer ${token}`
        }
    }],
    ['join', {
        parameters: ['parts'],
        execute: async (args: string[]) => {
            return args.join('')
        }
    }],
    ['basicAuth', {
        parameters: ['username', 'password'],
        execute: async (args: string[]) => {
            const username = args[0]
            const password = args[1]
            return `Basic ${btoa(`${username}:${password}`)}`
        }
    }]
])

export default httpFunctions