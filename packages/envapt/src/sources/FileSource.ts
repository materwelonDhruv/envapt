import fs from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import type { FileBackedSource } from '../types';

/**
 * Default environment source on Node, Bun, and Deno: a snapshot of `process.env`. Its
 * `supportsFiles` is `true`, so the engine also layers the `.env` cascade on top, resolves
 * `baseDir`, and can mirror loaded keys back to `process.env`.
 * @public
 */
export class FileSource implements FileBackedSource {
    /** Always `true`. The engine layers the `.env` cascade and `baseDir` on top of `process.env`. */
    readonly supportsFiles = true;

    /** Returns a snapshot clone of `process.env` as plain strings. */
    readVars(): Record<string, string> {
        // Clone so the loader and downstream reads never mutate process.env.
        return { ...(process.env as Record<string, string>) };
    }

    /** Reads a file with `fs.readFileSync`, or `undefined` when it is missing or unreadable. */
    readFile(path: string, encoding: string): string | undefined {
        try {
            // justified: our public encoding type is `string`; fs needs the BufferEncoding subset.
            return fs.readFileSync(path, encoding as BufferEncoding);
        } catch {
            return undefined;
        }
    }

    /**
     * Resolves a directory path or a module / `file:` URL to an absolute directory. A `file:` URL
     * resolves to its containing directory, and a plain path (`import.meta.dirname`, `__dirname`) is
     * taken as the directory itself.
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

    /** Writes each key to `process.env`, backing `Envapter.syncProcessEnv`. */
    writeVars(vars: Record<string, string>): void {
        for (const [key, value] of Object.entries(vars)) {
            process.env[key] = value;
        }
    }
}
