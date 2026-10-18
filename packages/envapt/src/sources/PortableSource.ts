import { coerceToStringRecord } from './coerce';

import type { BareSource } from '../types';

/**
 * Environment source seeded from an object you provide, for every runtime without a filesystem. Pass
 * the object straight through, such as the config your bundler injects into a browser build (Vite's
 * `import.meta.env`, a webpack `DefinePlugin` global), the Cloudflare `env` binding, a Vercel Edge or
 * Fastly config object, a test fixture, or any plain object. Non-string values are JSON-stringified so
 * the converters still apply. Those values must be JSON-serializable. Without a filesystem the `.env`
 * cascade and file APIs do not apply.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/sources#the-sources-envapt-ships}
 */
export class PortableSource implements BareSource {
    /** Always `false`. */
    readonly supportsFiles = false;
    private readonly vars: Record<string, string>;

    constructor(vars: object) {
        this.vars = coerceToStringRecord(vars);
    }

    /** Returns a copy of the provided object with every value as a string. */
    readVars(): Record<string, string> {
        return { ...this.vars };
    }
}
