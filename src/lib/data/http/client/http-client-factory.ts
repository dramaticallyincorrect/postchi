import BrowserClient from "./browser-client";
import { HttpClient } from "./http-client";

export function createHttpClient(): HttpClient {
    return new BrowserClient()
}