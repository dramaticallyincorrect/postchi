type HttpFunction = {
    parameters: string[],
    execute: (args: string[]) => Promise<string>
}

export const httpFunctions: Map<string, HttpFunction> = new Map([
    ['readText', {
        parameters: ['path'],
        execute: async (args: string[]) => {
            const path = args[0]
            // Implement the logic to read text from the specified path
            return `Content of ${path}`
        }
    }],
    ['bearer', {
        parameters: ['token'],
        execute: async (args: string[]) => {
            const token = args[0]
            return `Bearer ${token}`
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