// Shared by PortableSource and its deprecated aliases. The returned record is fresh, so a caller
// mutating its object later cannot leak into the source, and non-string values are JSON-stringified.
export function coerceToStringRecord(env: object): Record<string, string> {
    const snapshot: Record<string, string> = {};
    // `object` so a Cloudflare `Env` (an interface with no index signature) is accepted. cast to a record
    // to read entries as `unknown` rather than `any`.
    for (const [key, value] of Object.entries(env as Record<string, unknown>)) {
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
