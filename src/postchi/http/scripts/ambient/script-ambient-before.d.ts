declare const chi: {
    /** The outgoing request. Mutate its properties to change what gets sent. */
    request: ScriptRequest;
    /** Resolved environment variables for the active environment */
    env: Record<string, string>;
};
