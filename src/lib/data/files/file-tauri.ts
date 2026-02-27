import * as fs from "@tauri-apps/plugin-fs";
import * as paths from '@tauri-apps/api/path';

export class TauriFileStorage implements FileStorage {

    async readText(path: string): Promise<string> {
        return fs.readTextFile(path)
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
}