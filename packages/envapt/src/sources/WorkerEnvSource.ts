import { coerceToStringRecord } from './coerce';

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
        this.vars = coerceToStringRecord(env);
    }

    readVars(): Record<string, string> {
        return { ...this.vars };
    }
}
