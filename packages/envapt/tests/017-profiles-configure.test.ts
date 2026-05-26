import { resolve } from 'node:path';
import process from 'node:process';

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, Environment } from '../src';

describe('profiles — Envapter.configureProfiles overrides', () => {
    const originalCwd = process.cwd();
    const originalEnv = process.env.NODE_ENV;
    const fixtureDir = resolve(import.meta.dirname, 'environment'); // existing env fixtures

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
        // Use chdir to a benign dir so the cascade finds nothing — isolates the test to
        // the configured profile path.
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));

        // Set env first so configureProfiles' refresh hydrates with the right env.
        Envapter.environment = Environment.Staging;
        Envapter.configureProfiles({
            [Environment.Staging]: { paths: resolve(fixtureDir, '.env.staging') }
        });

        expect(Envapter.get('PROFILE_NAME')).to.equal('staging-profile');
        expect(Envapter.getNumber('PROFILE_PORT')).to.equal(4004);
    });

    it('falls through to cascade for environments not in configureProfiles', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));

        // Only production is overridden; development should still use the cascade.
        Envapter.environment = Environment.Development;
        Envapter.configureProfiles({
            [Environment.Production]: { paths: resolve(fixtureDir, '.env.production') }
        });
        expect(Envapter.get('CASCADE_KEY')).to.equal('dev-local'); // cascade still works

        // Switch to production — env-set alone doesn't refresh, so re-trigger via
        // resetProfiles (preserving env) is needed. Easier: re-call configureProfiles to
        // refresh under the new env.
        Envapter.environment = Environment.Production;
        Envapter.configureProfiles({
            [Environment.Production]: { paths: resolve(fixtureDir, '.env.production') }
        });
        expect(Envapter.get('PROFILE_NAME')).to.equal('production-profile'); // override active
    });

    it('configured paths take precedence over cascade layers for the same env', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));

        Envapter.configureProfiles({
            [Environment.Development]: { paths: resolve(fixtureDir, '.env.development') }
        });
        Envapter.environment = Environment.Development;

        // The configured `.env.development` (from tests/environment/) declares PROFILE_NAME=dev-profile.
        // The cascade's `.env.development.local` declares CASCADE_KEY=dev-local. Both should be present;
        // the configured profile's keys win where overlapping with cascade keys.
        expect(Envapter.get('PROFILE_NAME')).to.equal('dev-profile'); // from configured override
        expect(Envapter.get('CASCADE_KEY')).to.equal('dev-local'); // from cascade (no overlap)
    });

    it('accepts an array of paths in profile.paths', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));

        Envapter.environment = Environment.Production;
        Envapter.configureProfiles({
            [Environment.Production]: {
                paths: [resolve(fixtureDir, '.env.production'), resolve(fixtureDir, '.env.staging')]
            }
        });

        // First file wins in dotenv first-defined semantics: .env.production loads first,
        // .env.staging would only fill in absent keys.
        expect(Envapter.get('PROFILE_NAME')).to.equal('production-profile');
    });

    it('disables the cascade entirely when useDefaults is false', () => {
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'all-layers'));

        Envapter.configureProfiles({
            [Environment.Development]: { paths: resolve(fixtureDir, '.env.development') },
            useDefaults: false
        });
        Envapter.environment = Environment.Development;

        // Configured profile path is loaded.
        expect(Envapter.get('PROFILE_NAME')).to.equal('dev-profile');
        // Cascade-only key is NOT loaded since cascade was disabled.
        expect(Envapter.get('CASCADE_KEY')).to.be.undefined;
        expect(Envapter.get('ONLY_BASE')).to.be.undefined;
    });

    it('throws EnvFilesNotFound at configure-time when an active-env profile path does not exist', () => {
        // Fail-fast: bad config surfaces immediately, not on first data access.
        expect(() => {
            Envapter.configureProfiles({
                [Environment.Development]: { paths: '/does/not/exist/anywhere.env' }
            });
        })
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.EnvFilesNotFound);
    });

    it('does NOT throw for non-active envs with missing paths (lazy per-env validation)', () => {
        // Configure prod with a non-existent path while in development.
        // Should not throw because the prod path is not active yet.
        Envapter.configureProfiles({
            [Environment.Production]: { paths: '/does/not/exist/anywhere.env' }
        });
        Envapter.environment = Environment.Development;

        // Development cascade still works.
        process.chdir(resolve(import.meta.dirname, 'cascade-fixtures', 'default'));
        expect(() => Envapter.get('CASCADE_KEY')).to.not.throw();
    });

    it('is overridden by an explicit Envapter.envPaths assignment', () => {
        Envapter.configureProfiles({
            [Environment.Development]: { paths: resolve(fixtureDir, '.env.development') }
        });
        Envapter.envPaths = resolve(fixtureDir, '.env.production'); // explicit override
        Envapter.environment = Environment.Development;

        // envPaths wins — we read prod values even though env is development and profiles
        // configured a dev path.
        expect(Envapter.get('PROFILE_NAME')).to.equal('production-profile');
    });
});
