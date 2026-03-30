export interface FileStorage {
    exists(path: string): Promise<boolean>;
    readText(path: string): Promise<string>;
    readFile(path: string): Promise<Blob>;
    writeText(path: string, text: string): Promise<void>;
    readDirectory(path: string): Promise<StorageEntry[]>;
    create(path: string, text?: string): Promise<void>;
    mkdir(path: string): Promise<void>;
    delete(path: string): Promise<void>;
    watch(path:string, callback: (event: FileChangeEvent) => void): Promise<UnWatchFunction>;
}

export enum FileWatchEventType {
    Created = "created",
    Modified = "modified",
    Deleted = "deleted"
}

export interface FileChangeEvent {
    type: FileWatchEventType;
    path: string;
}

export type UnWatchFunction = () => void;


export interface StorageEntry {
    filename: string;
    path: string;
    isDirectory: boolean;
}