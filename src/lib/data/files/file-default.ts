import { BrowserFileStorage } from "./file-browser"

export default class DefaultFileStorage implements FileStorage {
    private storage: FileStorage = defaultFileStorage()
    readText(path: string): Promise<string> {
        return this.storage.readText(path)
    }
    readDirectory(path: string): Promise<StorageEntry[]> {
        return this.storage.readDirectory(path)
    }

    create(path: string): Promise<void> {
        return this.storage.create(path)
    }

    mkdir(path: string): Promise<void> {
        return this.storage.mkdir(path)
    }

}

function defaultFileStorage(): FileStorage {
    // if (isTauri()) {
    //     return new BrowserFileStorage()
    // }

    return new BrowserFileStorage()
}

const isTauri = () => typeof window !== 'undefined' && '__TAURI__' in window;