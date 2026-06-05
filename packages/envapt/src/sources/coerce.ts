// Shared by ManualEnvSource and WorkerEnvSource. The returned record is fresh, so a caller mutating its
// object later can't leak into the source; non-string values are JSON-stringified.
export function coerceToStringRecord(env: Record<string, unknown>): Record<string, string> {
    const snapshot: Record<string, string> = {};
    for (const [key, value] of Object.entries(env)) {
        if (typeof value === 'string') {
            snapshot[key] = value;
            continue;
        }
        const encoded = JSON.stringify(value);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TS lib mistypes JSON.stringify's return as always-string; it is string | undefined at runtime
        if (encoded !== undefined) snapshot[key] = encoded;
    }
    return snapshot;
}
