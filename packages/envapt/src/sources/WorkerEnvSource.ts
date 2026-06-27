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
    /** Always `false`. With no filesystem, the `.env` cascade and file APIs do not apply. */
    readonly supportsFiles = false;
    private readonly vars: Record<string, string>;

    /** Seed the source from the Workers `env` binding. Non-string values are JSON-stringified, so they must be JSON-serializable. */
    constructor(env: Record<string, unknown>) {
        this.vars = coerceToStringRecord(env);
    }

    /** Returns a snapshot clone of the `env` binding as plain strings. */
    readVars(): Record<string, string> {
        return { ...this.vars };
    }
}
