import { fs } from 'memfs';
import { pathOf } from './join';
import { FileChangeEvent, FileStorage, FileWatchEventType, StorageEntry, UnWatchFunction } from './file';

type IDirent = {
    name: string
    parentPath: string
    isDirectory: () => boolean
    isFile: () => boolean
    isSymbolicLink: () => boolean
}

export class BrowserFileStorage implements FileStorage {

    async readText(path: string): Promise<string> {
        return fs.promises.readFile(path, 'utf-8').then<string>((data) => data.toString());
    }

    readFile(path: string): Promise<Blob> {
        return fs.promises.readFile(path)
            .then((data) => {
                return new Blob([data as Uint8Array<ArrayBuffer>]);
            });
    }

    writeText(path: string, text: string): Promise<void> {
        return fs.promises.writeFile(path, text);
    }

    async readDirectory(path: string): Promise<StorageEntry[]> {
        return fs.readdirSync(path, { withFileTypes: true }).map((file) => {
            if ((file as IDirent) !== undefined) {
                const entry = file as IDirent
                return { filename: entry.name, path: pathOf(path, entry.name), isDirectory: entry.isDirectory() }
            }
        }).filter(entry => entry !== undefined);
    }

    async create(path: string, text?: string): Promise<void> {
        fs.writeFileSync(path, text || '')
    }

    async mkdir(path: string): Promise<void> {
        fs.mkdirSync(path, { recursive: true })
    }

    delete(path: string): Promise<void> {
        return fs.promises.rm(path, { recursive: true });
    }

    async watch(path: string, callback: (event: FileChangeEvent) => void): Promise<UnWatchFunction> {
        const watcher = fs.watch(path, { recursive: true }, (eventType, filename) => {
            if (!filename) return;

            const fullPath = pathOf(path, filename.toString());
            let simplifiedType: FileWatchEventType | null = null;
            if (eventType === 'change') {
                simplifiedType = FileWatchEventType.Modified;
            } else if (eventType === 'rename') {
                if (fs.existsSync(fullPath)) {
                    simplifiedType = FileWatchEventType.Created;
                } else {
                    simplifiedType = FileWatchEventType.Deleted;
                }
            }

            if (simplifiedType) {
                callback({ type: simplifiedType, path: fullPath });
            }
        });

        return () => watcher.close();
    }
}