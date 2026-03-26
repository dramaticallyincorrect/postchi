import { isTauri } from "@tauri-apps/api/core";
import BrowserClient from "./browser-client";
import { HttpClient } from "./http-client";
import TauriHttpClient from "./http-client-tauri";

export function createHttpClient(): HttpClient {
    if (isTauri()) {
        return new TauriHttpClient()
    }
    return new BrowserClient()
}