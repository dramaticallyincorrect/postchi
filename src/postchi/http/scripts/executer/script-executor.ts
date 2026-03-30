export async function executeScript(
    context: Record<string, unknown>,
    code: string,
): Promise<unknown> {
    const keys = Object.keys(context);
    const values = Object.values(context);
    const fn = new Function(...keys, `return (async () => { ${code} })()`);
    return fn(...values);
}
