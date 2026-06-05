import fs from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import type { FileEnvSource } from '../types';

/**
 * Default environment source on Node, Bun, and Deno: a snapshot of `process.env`. Its
 * `supportsFiles` is `true`, so the engine also layers the `.env` cascade on top, resolves
 * `baseDir`, and can mirror loaded keys back to `process.env`.
 * @public
 */
export class NodeEnvSource implements FileEnvSource {
    readonly supportsFiles = true;

    readVars(): Record<string, string> {
        // Clone so the loader and downstream reads never mutate process.env.
        return { ...(process.env as Record<string, string>) };
    }

    readFile(path: string, encoding: string): string | undefined {
        try {
            // justified: our public encoding type is `string`; fs needs the BufferEncoding subset.
            return fs.readFileSync(path, encoding as BufferEncoding);
        } catch {
            return undefined;
        }
    }

    // `file:` URLs resolve to their containing directory; plain paths (`import.meta.dirname`, `__dirname`) are taken as the directory.
    normalizeBaseDir(value: string | URL): string {
        if (value instanceof URL) return dirname(fileURLToPath(value));
        if (value.startsWith('file:')) return dirname(fileURLToPath(value));
        return resolve(value);
    }

    resolvePath(baseDir: string, candidate: string): string {
        if (isAbsolute(candidate)) return candidate;
        return join(baseDir, candidate);
    }

    writeVars(vars: Record<string, string>): void {
        for (const [key, value] of Object.entries(vars)) {
            process.env[key] = value;
        }
    }
}
