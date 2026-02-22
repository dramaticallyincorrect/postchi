 interface FileStorage {
    readText(path: string): Promise<string>;
    readDirectory(path: string): Promise<StorageEntry[]>;
    create(path: string): Promise<void>;
    mkdir(path: string): Promise<void>;
}


interface StorageEntry {
    filename: string;
    path: string;
    isDirectory: boolean;
}