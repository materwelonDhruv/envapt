import { coerceToStringRecord } from './coerce';

import type { BareSource } from '../types';

/**
 * Environment source seeded from an object you provide, for every runtime without a filesystem. The
 * config your bundler injects into a browser build (Vite's `import.meta.env`, a webpack `DefinePlugin`
 * global), the Cloudflare `env` binding, a Vercel Edge or Fastly config object, a test fixture, or any
 * plain object. Pass it straight through. Non-string values are JSON-stringified so the converters
 * still apply, which means they must be JSON-serializable. Without a filesystem the `.env` cascade and
 * file APIs do not apply.
 * @public
 */
export class PortableSource implements BareSource {
    /** Always `false`. With no filesystem, the `.env` cascade and file APIs do not apply. */
    readonly supportsFiles = false;
    private readonly vars: Record<string, string>;

    /** Seed the source from `vars`. Non-string values are JSON-stringified so the converters still apply. */
    constructor(vars: object) {
        this.vars = coerceToStringRecord(vars);
    }

    /** Returns a snapshot clone of the provided object as plain strings. */
    readVars(): Record<string, string> {
        return { ...this.vars };
    }
}
