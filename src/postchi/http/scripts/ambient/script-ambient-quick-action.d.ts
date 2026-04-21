declare const chi: {
    /** Resolved environment variables for the active environment */
    env: Record<string, string>;
    /**
     * Persist a variable to the active environment's `.cenv` file.
     * @param key Variable name
     * @param value Value to store
     */
    setEnvironmentVariable(key: string, value: string): void;
    /**
     * Persist a secret to the secrets store (not written to `.cenv`).
     * @param key Secret name
     * @param value Value to store
     */
    setSecret(key: string, value: string): void;
    /**
     * Execute an HTTP request from the collections folder and return the response.
     * @param path Path relative to the collections folder, e.g. `"api/login.chttp"`
     */
    executeRequest(path: string): Promise<ScriptResponse>;
};
