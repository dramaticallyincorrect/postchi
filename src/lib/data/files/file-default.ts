import { isTauri } from "@tauri-apps/api/core"
import { BrowserFileStorage } from "./file-browser"
import { TauriFileStorage } from "./file-tauri"
import { FileChangeEvent, FileStorage, FileWatchEventType, StorageEntry, UnWatchFunction } from "./file"

export default class DefaultFileStorage implements FileStorage {
    private static instance: DefaultFileStorage | null = null
    private pendingSyntheticDeletes: Set<string> = new Set()
    private storage: FileStorage = defaultFileStorage()
    private watchCallbacks: Map<string, Set<(event: FileChangeEvent) => void>> = new Map()

    private constructor() { }

    static getInstance(): DefaultFileStorage {
        if (!DefaultFileStorage.instance) {
            DefaultFileStorage.instance = new DefaultFileStorage()
        }
        return DefaultFileStorage.instance
    }

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

    async create(path: string, text?: string): Promise<void> {
        await this.storage.create(path, text)
        this.emitSynthetic({ type: FileWatchEventType.Created, path })
    }

    mkdir(path: string): Promise<void> {
        return this.storage.mkdir(path)
    }

    async delete(path: string): Promise<void> {
        await this.storage.delete(path)
        this.pendingSyntheticDeletes.add(path)
        this.emitSynthetic({ type: FileWatchEventType.Deleted, path })
    }

    async watch(path: string, callback: (event: FileChangeEvent) => void): Promise<UnWatchFunction> {
        if (!this.watchCallbacks.has(path)) {
            this.watchCallbacks.set(path, new Set())
        }
        this.watchCallbacks.get(path)!.add(callback)

        // Wrap the real watcher callback to deduplicate synthetic events
        const wrappedCallback = (event: FileChangeEvent) => {
            if (event.type === FileWatchEventType.Deleted && this.pendingSyntheticDeletes.has(event.path)) {
                this.pendingSyntheticDeletes.delete(event.path)
                return
            }
            callback(event)
        }

        const unwatch = await this.storage.watch(path, wrappedCallback)
        return () => {
            this.watchCallbacks.get(path)?.delete(callback)
            if (this.watchCallbacks.get(path)?.size === 0) {
                this.watchCallbacks.delete(path)
            }
            unwatch()
        }
    }

    private emitSynthetic(event: FileChangeEvent): void {
        // Exact path match
        this.watchCallbacks.get(event.path)?.forEach(cb => cb(event))

        // Walk up all ancestors
        let current = event.path
        while (true) {
            const parent = current.substring(0, current.lastIndexOf("/"))
            if (!parent || parent === current) break
            this.watchCallbacks.get(parent)?.forEach(cb => cb(event))
            current = parent
        }

        // notify all descendant file watchers of deletes
        // deleting a folder won't trigger delete events for descendant files
        if (event.type === FileWatchEventType.Deleted) {
            this.watchCallbacks.forEach((callbacks, watchPath) => {
                if (watchPath.startsWith(event.path)) {
                    callbacks.forEach(cb => cb(event))
                }
            })
        }
    }
}

function defaultFileStorage(): FileStorage {
    if (isTauri()) {
        return new TauriFileStorage()
    }

    return new BrowserFileStorage()
}