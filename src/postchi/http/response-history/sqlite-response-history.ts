import Database from "@tauri-apps/plugin-sql";
import { IResponseHistory, StoredResponse, toHttpExecution, toStoredResponse } from "./response-history";
import { HttpExecution } from "../runner/http-runner";

const DB_URL = "sqlite:response-history.db";

const CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS response_history (
        file_path      TEXT    PRIMARY KEY,
        timestamp      INTEGER NOT NULL,
        status         INTEGER,
        duration_ms    INTEGER,
        req_method     TEXT,
        req_url        TEXT,
        req_headers    TEXT,
        req_body       TEXT,
        res_headers    TEXT,
        res_body       TEXT,
        content_type   TEXT,
        after_script_error TEXT
    )
`;

type DbRow = {
    file_path: string;
    timestamp: number;
    status: number;
    duration_ms: number;
    req_method: string;
    req_url: string;
    req_headers: string;
    req_body: string;
    res_headers: string;
    res_body: string | null;
    content_type: string;
    after_script_error: string | null;
};

export class SqliteResponseHistory implements IResponseHistory {
    private db: Database | null = null;

    private async getDb(): Promise<Database> {
        if (!this.db) {
            this.db = await Database.load(DB_URL);
            await this.db.execute(CREATE_TABLE);
        }
        return this.db;
    }

    async save(filePath: string, execution: HttpExecution): Promise<void> {
        const db = await this.getDb();
        const s = toStoredResponse(filePath, execution);
        await db.execute(
            `INSERT OR REPLACE INTO response_history
                (file_path, timestamp, status, duration_ms, req_method, req_url, req_headers, req_body, res_headers, res_body, content_type, after_script_error)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                s.filePath,
                s.timestamp,
                s.status,
                s.durationMs,
                s.reqMethod,
                s.reqUrl,
                JSON.stringify(s.reqHeaders),
                s.reqBody,
                JSON.stringify(s.resHeaders),
                s.resBody,
                JSON.stringify(s.contentTypeInfo),
                s.afterScriptError ?? null,
            ]
        );
    }

    async getLatest(filePath: string): Promise<HttpExecution | null> {
        const db = await this.getDb();
        const rows = await db.select<DbRow[]>(
            "SELECT * FROM response_history WHERE file_path = ?",
            [filePath]
        );
        if (rows.length === 0) return null;

        const row = rows[0];
        const stored: StoredResponse = {
            filePath: row.file_path,
            timestamp: row.timestamp,
            status: row.status,
            durationMs: row.duration_ms,
            reqMethod: row.req_method,
            reqUrl: row.req_url,
            reqHeaders: JSON.parse(row.req_headers),
            reqBody: row.req_body,
            resHeaders: JSON.parse(row.res_headers),
            resBody: row.res_body,
            contentTypeInfo: JSON.parse(row.content_type),
            afterScriptError: row.after_script_error ?? undefined,
        };
        return toHttpExecution(stored);
    }
}
