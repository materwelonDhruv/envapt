import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const REPO = path.resolve(import.meta.dirname, '../..');

// npm and JSR publish the package copy. GitHub renders the root one. pnpm pack skips a symlinked README.
describe('README copies', () => {
    it('keeps the package README identical to the root README', () => {
        const root = readFileSync(path.join(REPO, 'README.md'), 'utf8');
        const packaged = readFileSync(path.join(REPO, 'packages/envapt/README.md'), 'utf8');
        expect(packaged).toBe(root);
    });
});
