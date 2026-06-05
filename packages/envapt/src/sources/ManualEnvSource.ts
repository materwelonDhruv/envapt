import { coerceToStringRecord } from './coerce';

import type { BareEnvSource } from '../types';

/**
 * Environment source seeded from an object you provide: the config your bundler injects into a browser
 * build (Vite's `import.meta.env`, a webpack `DefinePlugin` global), a test fixture, or any other plain
 * object. Pass it straight through; non-string values are JSON-stringified so the converters still apply.
 * It has no filesystem, so the `.env` cascade and file-based APIs do not apply.
 * @public
 */
export class ManualEnvSource implements BareEnvSource {
    readonly supportsFiles = false;
    private readonly vars: Record<string, string>;

    constructor(vars: Record<string, unknown>) {
        this.vars = coerceToStringRecord(vars);
    }

    readVars(): Record<string, string> {
        return { ...this.vars };
    }
}
