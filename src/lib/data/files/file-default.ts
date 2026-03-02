import { isTauri } from "@tauri-apps/api/core"
import { BrowserFileStorage } from "./file-browser"
import { TauriFileStorage } from "./file-tauri"

export default class DefaultFileStorage implements FileStorage {
    private storage: FileStorage = defaultFileStorage()
    readText(path: string): Promise<string> {
        return this.storage.readText(path)
    }

    readFile(path: string): Promise<Blob> {
        return this.storage.readFile(path)
    }
    
    writeText(path: string, text: string): Promise<void> {
        return this.storage.writeText(path, text)
    }

    readDirectory(path: string): Promise<StorageEntry[]> {
        return this.storage.readDirectory(path)
    }

    create(path: string, text?: string): Promise<void> {
        return this.storage.create(path, text)
    }

    mkdir(path: string): Promise<void> {
        return this.storage.mkdir(path)
    }

}

function defaultFileStorage(): FileStorage {
    if (isTauri()) {
        return new TauriFileStorage()
    }

    return new BrowserFileStorage()
}