import { isTauri } from "@tauri-apps/api/core";
import { IResponseHistory } from "./response-history";
import { MemoryResponseHistory } from "./memory-response-history";
import { SqliteResponseHistory } from "./sqlite-response-history";

let instance: IResponseHistory | null = null;

export function getResponseHistory(): IResponseHistory {
    if (!instance) {
        instance = isTauri() ? new SqliteResponseHistory() : new MemoryResponseHistory();
    }
    return instance;
}
