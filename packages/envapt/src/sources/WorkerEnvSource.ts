import type { BareEnvSource } from '../types';

/**
 * Environment source for Cloudflare Workers, seeded from the `env` binding. String bindings pass
 * through; non-string bindings are JSON-stringified so the converters still apply, and so must be
 * JSON-serializable (a `bigint` or circular value throws). No filesystem, so the `.env` cascade and
 * file-based APIs do not apply.
 * @public
 */
export class WorkerEnvSource implements BareEnvSource {
    readonly supportsFiles = false;
    private readonly vars: Record<string, string>;

    constructor(env: Record<string, unknown>) {
        const snapshot: Record<string, string> = {};
        for (const [key, value] of Object.entries(env)) {
            if (typeof value === 'string') {
                snapshot[key] = value;
                continue;
            }
            // JSON.stringify returns undefined for undefined / functions / symbols; drop those keys.
            const encoded = JSON.stringify(value);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TS lib mistypes JSON.stringify's return as always-string; it is string | undefined at runtime
            if (encoded !== undefined) snapshot[key] = encoded;
        }
        this.vars = snapshot;
    }

    readVars(): Record<string, string> {
        return { ...this.vars };
    }
}
