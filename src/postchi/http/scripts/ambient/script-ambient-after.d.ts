declare const chi: {
    /** The request that was sent */
    request: ScriptRequest;
    /** The HTTP response that was received */
    response: ScriptResponse;
    /** environment variables for the active environment */
    env: Record<string, string>;
    /** Make a sub-request using the browser Fetch API */
    fetch: typeof globalThis.fetch;
    /**
     * Persist a variable to the active environment.
     * @param key Variable name
     * @param value Value to store
     */
    setEnvironmentVariable(key: string, value: string): void;
    /**
     * Persist a variable to the active environment.
     * @param key Secret name
     * @param value Value to store
     */
    setSecret(key: string, value: string): void;
};
