import fs from 'node:fs';
import process from 'node:process';

import type { EnvSource } from '../types';

/**
 * Default environment source on Node, Bun, and Deno: a snapshot of `process.env`. Its
 * `supportsFiles` is `true`, so the engine also layers the `.env` cascade on top.
 * @public
 */
export class NodeEnvSource implements EnvSource {
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
}
