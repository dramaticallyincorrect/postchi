import { shuffle } from '@/lib/utils/list';
import fs from 'fs';
import { join } from 'path';



export class TestFileStorage implements FileStorage {
    readText(path: string): Promise<string> {
        return fs.promises.readFile(path, 'utf-8');
    }
    readDirectory(path: string): Promise<StorageEntry[]> {
        const entries = fs.readdirSync(path, { withFileTypes: true });
        const items = entries.map(entry => ({
            filename: entry.name,
            path: join(entry.parentPath, entry.name),
            isDirectory: entry.isDirectory(),
        }))
        return Promise.resolve(shuffle(items));
    }

    create(path: string): Promise<void> {
        return fs.promises.writeFile(path, '');
    }

    mkdir(path: string): Promise<void> {
        return fs.promises.mkdir(path)
    }

}