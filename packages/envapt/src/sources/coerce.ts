// copies the entries so a later change to the caller's object does not reach the source
export function coerceToStringRecord(env: object): Record<string, string> {
    const snapshot: Record<string, string> = {};
    // takes `object` because a Cloudflare Env interface has no index signature
    for (const [key, value] of Object.entries(env as Record<string, unknown>)) {
        if (typeof value === 'string') {
            snapshot[key] = value;
            continue;
        }
        const encoded = JSON.stringify(value);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TS lib mistypes JSON.stringify's return as always-string when it is string | undefined at runtime
        if (encoded !== undefined) snapshot[key] = encoded;
    }
    return snapshot;
}
