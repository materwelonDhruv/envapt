import { resolve } from 'node:path';
import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, Environment } from '../src';

describe('profiles — Envapter.configureProfiles overrides', () => {
    const originalCwd = process.cwd();
    const originalEnv = process.env.NODE_ENV;
    const fixtureDir = resolve(import.meta.dirname, 'environment');

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

    it('loads profile-configured paths for the active environment (partial override)', () => {
        // chdir to a dir with no cascade files, so only the configured profile path loads
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));

        // set env before configureProfiles, so its refresh runs under the right env
        Envapter.environment = Environment.Staging;
        Envapter.configureProfiles({
            [Environment.Staging]: { paths: resolve(fixtureDir, '.env.staging') }
        });

        expect(Envapter.get('PROFILE_NAME')).to.equal('staging-profile');
        expect(Envapter.getNumber('PROFILE_PORT')).to.equal(4004);
    });

    it('falls through to cascade for environments not in configureProfiles', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));

        // only production is overridden, so development still reads the cascade
        Envapter.environment = Environment.Development;
        Envapter.configureProfiles({
            [Environment.Production]: { paths: resolve(fixtureDir, '.env.production') }
        });
        expect(Envapter.get('CASCADE_KEY')).to.equal('dev-local');

        // setting env alone doesn't refresh, so re-call configureProfiles under the new env
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

        // configured profile keys win where they overlap cascade keys
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

        // dotenv is first-defined-wins, so .env.production loads first and .env.staging only fills gaps
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
        // useDefaults:false disabled the cascade, so its keys never load
        expect(Envapter.get('CASCADE_KEY')).to.be.undefined;
        expect(Envapter.get('ONLY_BASE')).to.be.undefined;
    });

    it('throws EnvFilesNotFound at configure-time when an active-env profile path does not exist', () => {
        // bad config throws at configure() time, before any data access
        expect(() => {
            Envapter.configureProfiles({
                [Environment.Development]: { paths: '/does/not/exist/anywhere.env' }
            });
        })
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.EnvFilesNotFound);
    });

    it('does NOT throw for non-active envs with missing paths (lazy per-env validation)', () => {
        // the missing prod path is not the active env, so it isn't validated yet
        Envapter.configureProfiles({
            [Environment.Production]: { paths: '/does/not/exist/anywhere.env' }
        });
        Envapter.environment = Environment.Development;

        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));
        expect(() => Envapter.get('CASCADE_KEY')).to.not.throw();
    });

    it('is overridden by an explicit Envapter.envPaths assignment', () => {
        Envapter.configureProfiles({
            [Environment.Development]: { paths: resolve(fixtureDir, '.env.development') }
        });
        Envapter.envPaths = resolve(fixtureDir, '.env.production');
        Envapter.environment = Environment.Development;

        // envPaths outranks profiles, so a dev env still reads the prod file
        expect(Envapter.get('PROFILE_NAME')).to.equal('production-profile');
    });
});
