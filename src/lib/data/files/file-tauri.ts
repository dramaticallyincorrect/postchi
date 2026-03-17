import * as fs from "@tauri-apps/plugin-fs";
import * as paths from '@tauri-apps/api/path';
import { FileChangeEvent, FileStorage, FileWatchEventType, StorageEntry, UnWatchFunction } from "./file";

export class TauriFileStorage implements FileStorage {

    exists(path: string): Promise<boolean> {
        return fs.exists(path)
    }

    async readText(path: string): Promise<string> {
        return fs.readTextFile(path)
    }

    readFile(path: string): Promise<Blob> {
        return fs.readFile(path).then((data) => new Blob([data]))
    }

    writeText(path: string, text: string): Promise<void> {
        return fs.writeTextFile(path, text)
    }

    async readDirectory(path: string): Promise<StorageEntry[]> {
        const entries = await fs.readDir(path).then(entries => {
            return entries.map(async entry => ({
                filename: entry.name,
                path: await paths.join(path, entry.name),
                isDirectory: entry.isDirectory
            }));
        });

        return Promise.all(entries);
    }

    async create(path: string, text?: string): Promise<void> {
        await fs.create(path)
        if (text) {
            await this.writeText(path, text)
        }
    }

    async mkdir(path: string): Promise<void> {
        fs.mkdir(path, { recursive: true })
    }

    delete(path: string): Promise<void> {
        return fs.remove(path, { recursive: true })
    }

    async watch(path: string, callback: (event: FileChangeEvent) => void): Promise<UnWatchFunction> {
        return await fs.watch(path, (event) => {
            const { type, paths } = event;
            let simplifiedType: FileWatchEventType | null = null;

            // 1. Narrow the type to 'object' so TS allows the 'in' operator
            if (typeof type === 'object' && type !== null) {
                if ('create' in type) {
                    simplifiedType = FileWatchEventType.Created;
                } else if ('modify' in type) {
                    simplifiedType = FileWatchEventType.Modified;
                } else if ('remove' in type) {
                    simplifiedType = FileWatchEventType.Deleted;
                }
            }

            if (simplifiedType) {
                paths.forEach((p) => callback({ type: simplifiedType!, path: p }));
            }

        }, { recursive: true })
    }
}