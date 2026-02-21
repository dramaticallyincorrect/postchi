import * as fs from "@tauri-apps/plugin-fs";
import * as paths from '@tauri-apps/api/path';

export class TauriFileStorage implements FileStorage {

    async readText(path: string): Promise<string> {
        return fs.readTextFile(path)
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

    async create(path: string): Promise<void> {
        fs.create(path)
    }

    async mkdir(path: string): Promise<void> {
        fs.mkdir(path)
    }
}