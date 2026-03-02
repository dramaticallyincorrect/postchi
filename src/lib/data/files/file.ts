interface FileStorage {
    readText(path: string): Promise<string>;
    readFile(path: string): Promise<Blob>;
    writeText(path: string, text: string): Promise<void>;
    readDirectory(path: string): Promise<StorageEntry[]>;
    create(path: string, text?: string): Promise<void>;
    mkdir(path: string): Promise<void>;
}


interface StorageEntry {
    filename: string;
    path: string;
    isDirectory: boolean;
}