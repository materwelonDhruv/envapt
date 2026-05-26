import { resolve } from 'node:path';
import process from 'node:process';

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';

import { Envapter, Environment } from '../src';

/**
 * The cascade resolves paths relative to `process.cwd()`. These tests chdir into a
 * fixture dir before each case and restore afterward. They also reset `_environment`
 * and `_envPathsExplicitlySet` through the public API surface so the cascade is the
 * active path-resolution mode.
 */
describe('profiles — dotenv-flow auto-cascade', () => {
    const originalCwd = process.cwd();
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        Envapter.resetProfiles();
        Envapter.environment = Environment.Development;
    });

    afterEach(() => {
        process.chdir(originalCwd);
        if (originalEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalEnv;
        Envapter.resetProfiles();
    });

    it('loads only `.env` when no other cascade files exist', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));
        process.env.NODE_ENV = 'development';
        Envapter.environment = Environment.Development;
        Envapter.resetProfiles(); // chdir alone doesn't invalidate the data cache

        expect(Envapter.get('CASCADE_KEY')).to.equal('base');
        expect(Envapter.get('BASE_ONLY')).to.equal('set-by-dot-env');
    });

    it('applies full layer precedence: `.env.${env}.local` > `.env.local` > `.env.${env}` > `.env`', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));
        process.env.NODE_ENV = 'development';
        Envapter.environment = Environment.Development;
        Envapter.resetProfiles();

        // Highest layer: .env.development.local wins where it sets a key
        expect(Envapter.get('CASCADE_KEY')).to.equal('dev-local');
        // Each layer's unique key surfaces
        expect(Envapter.get('ONLY_BASE')).to.equal('base');
        expect(Envapter.get('ONLY_LOCAL')).to.equal('local');
        expect(Envapter.get('ONLY_DEV')).to.equal('dev');
        expect(Envapter.get('ONLY_DEV_LOCAL')).to.equal('dev-local');
        // Pairwise precedence: .env.local beats .env
        expect(Envapter.get('SHARED_BASE_LOCAL')).to.equal('local');
        // .env.${env} beats .env
        expect(Envapter.get('SHARED_BASE_ENV')).to.equal('dev');
        // .env.${env}.local beats .env
        expect(Envapter.get('SHARED_BASE_ENV_LOCAL')).to.equal('dev-local');
        // .env.${env} beats .env.local (env-specific is higher than non-env-specific local)
        expect(Envapter.get('SHARED_LOCAL_ENV')).to.equal('dev');
        // .env.${env}.local beats .env.local
        expect(Envapter.get('SHARED_LOCAL_ENV_LOCAL')).to.equal('dev-local');
        // .env.${env}.local beats .env.${env}
        expect(Envapter.get('SHARED_DEV_DEV_LOCAL')).to.equal('dev-local');
    });

    it('switches cascade files when the active environment changes', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));

        process.env.NODE_ENV = 'development';
        Envapter.resetProfiles();
        expect(Envapter.get('CASCADE_KEY')).to.equal('dev-local'); // hits .env.development.local

        process.env.NODE_ENV = 'production';
        Envapter.resetProfiles();
        expect(Envapter.get('CASCADE_KEY')).to.equal('prod'); // hits .env.production (no .local for prod)
        expect(Envapter.get('ONLY_PROD')).to.equal('prod');
        expect(Envapter.get('ONLY_DEV')).to.be.undefined; // dev file not in cascade for prod
    });

    it('silently skips missing cascade files', () => {
        // The `default` fixture only has `.env` — no `.env.local`, `.env.development`, etc.
        // Cascade should NOT throw on missing files; it just loads what exists.
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));
        Envapter.environment = Environment.Development;
        Envapter.resetProfiles();

        expect(() => Envapter.get('CASCADE_KEY')).to.not.throw();
        expect(Envapter.get('CASCADE_KEY')).to.equal('base');
    });

    it('reads process.env.NODE_ENV when Envapter.environment was never explicitly set', () => {
        // Clear the explicit environment by resetting, then ensure cascade picks the env
        // file based purely on process.env.NODE_ENV.
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));
        process.env.NODE_ENV = 'production';
        Envapter.resetProfiles(); // also clears _environment via super.refreshCache override

        expect(Envapter.get('CASCADE_KEY')).to.equal('prod');
        expect(Envapter.get('ONLY_PROD')).to.equal('prod');
    });

    it('maps process.env.NODE_ENV=staging to Environment.Staging', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));
        process.env.NODE_ENV = 'staging';
        Envapter.resetProfiles();

        expect(Envapter.get('CASCADE_KEY')).to.equal('staging');
        expect(Envapter.get('ONLY_STAGING')).to.equal('staging');
    });

    it('honors process.env.ENVIRONMENT over ENV and NODE_ENV', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));
        process.env.ENVIRONMENT = 'production';
        process.env.ENV = 'staging';
        process.env.NODE_ENV = 'development';
        Envapter.resetProfiles();

        try {
            expect(Envapter.get('CASCADE_KEY')).to.equal('prod');
        } finally {
            delete process.env.ENVIRONMENT;
            delete process.env.ENV;
        }
    });

    it('honors process.env.ENV when ENVIRONMENT is absent', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));
        delete process.env.ENVIRONMENT;
        process.env.ENV = 'staging';
        process.env.NODE_ENV = 'development';
        Envapter.resetProfiles();

        try {
            expect(Envapter.get('CASCADE_KEY')).to.equal('staging');
        } finally {
            delete process.env.ENV;
        }
    });

    it('falls back to development when ENVIRONMENT, ENV, and NODE_ENV are all absent', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));
        delete process.env.ENVIRONMENT;
        delete process.env.ENV;
        delete process.env.NODE_ENV;
        Envapter.resetProfiles();

        // No env vars set → cascade falls back to Development → loads .env.development.local etc.
        expect(Envapter.get('CASCADE_KEY')).to.equal('dev-local');
    });
});
