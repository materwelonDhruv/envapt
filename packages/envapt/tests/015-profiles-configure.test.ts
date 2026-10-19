import { resolve } from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, Environment } from '../src';

describe('profiles — Envapter.configureProfiles overrides', () => {
    const originalCwd = process.cwd();
    const originalEnv = process.env.NODE_ENV;
    const fixtureDir = resolve(import.meta.dirname, 'environment');

    beforeEach(() => {
        Envapter.resetPaths();
        Envapter.environment = Environment.Development;
    });

    afterEach(() => {
        process.chdir(originalCwd);
        if (originalEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalEnv;
        Envapter.resetPaths();
    });

    it('loads profile-configured paths for the active environment (partial override)', () => {
        // the default fixture has no staging cascade files
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));

        Envapter.environment = Environment.Staging;
        Envapter.configureProfiles({
            [Environment.Staging]: { paths: resolve(fixtureDir, '.env.staging') }
        });

        expect(Envapter.get('PROFILE_NAME')).to.equal('staging-profile');    });

    it('falls through to cascade for environments not in configureProfiles', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));

        Envapter.environment = Environment.Development;
        Envapter.configureProfiles({
            [Environment.Production]: { paths: resolve(fixtureDir, '.env.production') }
        });
        expect(Envapter.get('CASCADE_KEY')).to.equal('dev-local');

        Envapter.environment = Environment.Production;
        Envapter.configureProfiles({
            [Environment.Production]: { paths: resolve(fixtureDir, '.env.production') }
        });
        expect(Envapter.get('PROFILE_NAME')).to.equal('production-profile');
    });

    it('configured paths take precedence over cascade layers for the same env', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));

        Envapter.configureProfiles({
            [Environment.Development]: { paths: resolve(fixtureDir, '.env.development') }
        });
        Envapter.environment = Environment.Development;

        expect(Envapter.get('PROFILE_NAME')).to.equal('dev-profile'); // from the configured override
        expect(Envapter.get('CASCADE_KEY')).to.equal('dev-local'); // from the cascade, no overlap
    });

    it('accepts an array of paths in profile.paths', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));

        Envapter.environment = Environment.Production;
        Envapter.configureProfiles({
            [Environment.Production]: {
                paths: [resolve(fixtureDir, '.env.production'), resolve(fixtureDir, '.env.staging')]
            }
        });

        // .env.staging only fills keys that .env.production left unset
        expect(Envapter.get('PROFILE_NAME')).to.equal('production-profile');
    });

    it('disables the cascade entirely when useDefaults is false', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));

        Envapter.configureProfiles({
            [Environment.Development]: { paths: resolve(fixtureDir, '.env.development') },
            useDefaults: false
        });
        Envapter.environment = Environment.Development;

        expect(Envapter.get('PROFILE_NAME')).to.equal('dev-profile');
        expect(Envapter.get('CASCADE_KEY')).to.be.undefined;
        expect(Envapter.get('ONLY_BASE')).to.be.undefined;
    });

    it('throws EnvFilesNotFound at configure-time when an active-env profile path does not exist', () => {
        expect(() => {
            Envapter.configureProfiles({
                [Environment.Development]: { paths: '/does/not/exist/anywhere.env' }
            });
        })
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.EnvFilesNotFound);
    });

    it('does NOT throw for non-active envs with missing paths (lazy per-env validation)', () => {
        Envapter.configureProfiles({
            [Environment.Production]: { paths: '/does/not/exist/anywhere.env' }
        });
        Envapter.environment = Environment.Development;

        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));
        expect(() => Envapter.get('CASCADE_KEY')).to.not.throw();
    });

    it('throws EnvFilesNotFound when switching to an env whose profile path is missing', () => {
        Envapter.configureProfiles({
            [Environment.Production]: { paths: '/does/not/exist/anywhere.env' }
        });

        expect(() => (Envapter.environment = Environment.Production))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.EnvFilesNotFound);
    });

    it('is overridden by an explicit Envapter.envPaths assignment', () => {
        Envapter.configureProfiles({
            [Environment.Development]: { paths: resolve(fixtureDir, '.env.development') }
        });
        Envapter.envPaths = resolve(fixtureDir, '.env.production');
        Envapter.environment = Environment.Development;

        expect(Envapter.get('PROFILE_NAME')).to.equal('production-profile');
    });
});
