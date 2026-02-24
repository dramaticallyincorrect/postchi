
export class BrowserFileStorage implements FileStorage {

    async readText(path: string): Promise<string> {
        return `
// this is a comment
GET https://jsonplaceholder.typicode.com/todos`;
    }

    async readDirectory(path: string): Promise<StorageEntry[]> {
        console.log(`Reading directory at ${path}`)
        if (path.endsWith('collections')) {
            return [
                { filename: 'users.get', path: '/collections/users.get', isDirectory: false },
                { filename: 'token.get', path: '/collections/token.get', isDirectory: false },
                { filename: 'courses', path: '/collections/courses', isDirectory: true },
            ]
        }
        if (path.endsWith('courses')) {
            return []
        }
        return [
            { filename: 'collections', path: '/collections', isDirectory: true },
        ]

    }

    async create(path: string): Promise<void> {
        console.log(`Creating file at ${path}`)
    }

    async mkdir(path: string): Promise<void> {
        console.log(`Creating directory at ${path}`)
    }
}