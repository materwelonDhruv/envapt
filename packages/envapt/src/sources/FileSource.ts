import fs from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import type { FileCapableSource } from '../types';

/**
 * Default environment source on Node, Bun, and Deno: a snapshot of `process.env`. Because
 * `supportsFiles` is `true`, envapt also loads the `.env` cascade and resolves `baseDir`.
 * A key set in `process.env` wins over the same key in a file unless `envFileOptions.override` is
 * `true`. `Envapter.syncProcessEnv` can copy loaded keys back to `process.env`.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/sources#the-sources-envapt-ships}
 */
export class FileSource implements FileCapableSource {
    /** Always `true`. */
    readonly supportsFiles = true;

    /** Returns a copy of `process.env`. */
    readVars(): Record<string, string> {
        return { ...(process.env as Record<string, string>) };
    }

    /** Reads a file with `fs.readFileSync`, or `undefined` when it is missing or unreadable. */
    readFile(path: string, encoding: string): string | undefined {
        try {
            // EnvFileOptions.encoding is a plain string
            return fs.readFileSync(path, encoding as BufferEncoding);
        } catch {
            return undefined;
        }
    }

    /**
     * Resolves a directory path or a module / `file:` URL to an absolute directory. A `file:` URL
     * resolves to its containing directory. A plain path (`import.meta.dirname`) is taken as the
     * directory itself.
     */
    normalizeBaseDir(value: string | URL): string {
        if (value instanceof URL) return dirname(fileURLToPath(value));
        if (value.startsWith('file:')) return dirname(fileURLToPath(value));
        return resolve(value);
    }

    /** Joins a relative `.env` path onto `baseDir`. Absolute paths pass through unchanged. */
    resolvePath(baseDir: string, candidate: string): string {
        if (isAbsolute(candidate)) return candidate;
        return join(baseDir, candidate);
    }

    /** Writes each key to `process.env`. `Envapter.syncProcessEnv` calls it. */
    writeVars(vars: Record<string, string>): void {
        for (const [key, value] of Object.entries(vars)) {
            process.env[key] = value;
        }
    }
}
