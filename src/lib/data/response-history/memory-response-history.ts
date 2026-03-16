import { HttpExecution } from "../http/http-runner";
import { IResponseHistory, toHttpExecution, toStoredResponse } from "./response-history";

export class MemoryResponseHistory implements IResponseHistory {
    private store = new Map<string, ReturnType<typeof toStoredResponse>>();

    async save(filePath: string, execution: HttpExecution): Promise<void> {
        this.store.set(filePath, toStoredResponse(filePath, execution));
    }

    async getLatest(filePath: string): Promise<HttpExecution | null> {
        const stored = this.store.get(filePath);
        if (!stored) return null;
        return toHttpExecution(stored);
    }
}
