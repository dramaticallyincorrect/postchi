declare type ScriptRequest = {
    /** HTTP method, e.g. `"GET"`, `"POST"` */
    method: string;
    /** Full request URL */
    url: string;
    /** Request headers as a key-value map */
    headers: Record<string, string>;
    /** Request body as a string, or `null` for bodyless requests */
    body: string | null;
};

declare type ScriptResponse = {
    /** HTTP status code, e.g. `200`, `404` */
    status: number;
    /** Response headers as a key-value map */
    headers: Record<string, string>;
    /** Response body as text, or `null` for binary responses */
    body: string | null;
};
