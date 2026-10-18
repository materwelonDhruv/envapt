import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createFileSystemTypesCache } from 'fumadocs-twoslash/cache-fs';

import type { TwoslashTypesCache } from 'fumadocs-twoslash';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENVAPT_DIST = path.resolve(HERE, '../node_modules/envapt/dist');
const SALT_LENGTH = 12;

// the stock cache keys on snippet text alone. it serves stale hovers after envapt's dist is rebuilt
function envaptTypesSalt(): string {
    try {
        const files = readdirSync(ENVAPT_DIST, { recursive: true, encoding: 'utf8' })
            .filter((f) => f.endsWith('.d.ts') || f.endsWith('.d.mts') || f.endsWith('.d.cts'))
            .sort();
        const hash = createHash('sha256');
        for (const file of files) hash.update(readFileSync(path.join(ENVAPT_DIST, file)));
        return hash.digest('hex').slice(0, SALT_LENGTH);
    } catch {
        return 'no-dist';
    }
}

export function createSaltedTypesCache(): TwoslashTypesCache {
    const base = createFileSystemTypesCache();
    const prefix = `// envapt-types:${envaptTypesSalt()}\n`;
    return {
        ...base,
        read: (code) => base.read(prefix + code),
        write: (code, data) => base.write(prefix + code, data)
    };
}
