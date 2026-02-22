
export class BrowserFileStorage implements FileStorage {

    async readText(path: string): Promise<string> {
        return `
// this is a comment
GET /api/path`;
    }

    async readDirectory(path: string): Promise<StorageEntry[]> {
        if (path.endsWith('/folder1')) {
            return []
        }
        return [
            { filename: 'file1.get', path: '/file1.get', isDirectory: false },
            { filename: 'file2.get', path: '/file2.get', isDirectory: false },
            { filename: 'folder1', path: '/folder1', isDirectory: true },
        ]
    }

    async create(path: string): Promise<void> {
        console.log(`Creating file at ${path}`)
    }

    async mkdir(path: string): Promise<void> {
        console.log(`Creating directory at ${path}`)
    }
}