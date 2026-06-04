import type { BareEnvSource } from '../types';

/**
 * Environment source seeded from a plain object you provide. Use it on the browser, in tests,
 * or anywhere without an ambient environment: `Envapter.useSource(new ManualEnvSource(vars))`.
 * It has no filesystem, so the `.env` cascade and file-based APIs do not apply.
 * @public
 */
export class ManualEnvSource implements BareEnvSource {
    readonly supportsFiles = false;
    private readonly vars: Record<string, string>;

    constructor(vars: Record<string, string>) {
        // Snapshot on construction so later mutations of the caller's object don't leak in.
        this.vars = { ...vars };
    }

    readVars(): Record<string, string> {
        return { ...this.vars };
    }
}
