import { resolve } from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Envapter } from '../src';
import { EnvaptCache } from '../src/core/EnvapterBase';

const FIXTURE_KEYS = ['CONFIG_KEY_A', 'CONFIG_KEY_B'] as const;
const FIXTURE_PATH = resolve(import.meta.dirname, '.env.config-entry');

function cleanFixtureKeys(): void {
    for (const k of FIXTURE_KEYS) Reflect.deleteProperty(process.env, k);
}

describe('Envapter.load()', () => {
    it('eagerly populates the cache and is idempotent', () => {
        Envapter.load();
        const size = EnvaptCache.size;
        expect(size).to.be.greaterThan(0);
        Envapter.load();
        expect(EnvaptCache.size).to.equal(size);
    });
});

describe('envapt/config side-effect entry', () => {
    beforeEach(() => {
        // Scrub before envPaths triggers the rebuild: the loader only tracks keys absent from process.env as "added", and only added keys get mirrored.
        Envapter.syncProcessEnv = false;
        Envapter.envFileOptions = {};
        cleanFixtureKeys();
        Envapter.envPaths = FIXTURE_PATH;
    });

    afterEach(() => {
        Envapter.syncProcessEnv = false;
        Envapter.envFileOptions = {};
        cleanFixtureKeys();
    });

    it('mirrors the loaded .env cascade into process.env on import', async () => {
        expect(process.env.CONFIG_KEY_A).to.equal(undefined);
        expect(Envapter.syncProcessEnv).to.equal(false);

        await import('../src/config');

        expect(process.env.CONFIG_KEY_A).to.equal('alpha');
        expect(process.env.CONFIG_KEY_B).to.equal('beta');
        expect(Envapter.syncProcessEnv).to.equal(true);
    });
});
