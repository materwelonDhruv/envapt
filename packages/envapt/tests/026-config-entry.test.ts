import { resolve } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it, vi } from 'vitest';

const FIXTURE_KEYS = ['CONFIG_KEY_A', 'CONFIG_KEY_B'] as const;
const FIXTURE_DIR = resolve(import.meta.dirname, 'integration/config-entry');

function cleanFixtureKeys(): void {
    for (const k of FIXTURE_KEYS) Reflect.deleteProperty(process.env, k);
}

describe('envapt/config side-effect entry', () => {
    const originalCwd = process.cwd();

    afterEach(() => {
        process.chdir(originalCwd);
        cleanFixtureKeys();
    });

    it('loads the .env cascade from the working directory and mirrors it into process.env on a fresh import', async () => {
        cleanFixtureKeys();
        process.chdir(FIXTURE_DIR);
        vi.resetModules();

        await import('../src/config');
        const { Envapter } = await import('../src');

        expect(process.env.CONFIG_KEY_A).to.equal('alpha');
        expect(process.env.CONFIG_KEY_B).to.equal('alpha-beta');
        expect(Envapter.syncProcessEnv).to.equal(true);
    });
});
