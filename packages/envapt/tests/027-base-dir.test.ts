import fs from 'node:fs';
import os from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { expect } from 'chai';
import { afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import { Envapter, EnvaptErrorCodes, Environment } from '../src';
import { EnvaptError } from '../src/Error';

// Monorepo case: cwd is the repo root, not the package dir, so a cwd-relative `.env` lookup
// misses the package's file. `baseDir` anchors resolution to the package dir regardless of cwd.
const PKG_DIR = resolve(import.meta.dirname, 'basedir-fixtures', 'pkg');
const ABS_ENV = resolve(import.meta.dirname, 'basedir-fixtures', 'abs', '.env.abs');

describe('Envapter.baseDir', () => {
    const originalCwd = process.cwd();

    beforeAll(() => {
        // Bare `.env` is gitignored, so the fixture ships as `.env.base` and is materialized here
        // (same convention as the cascade fixtures in 016).
        fs.copyFileSync(join(PKG_DIR, '.env.base'), join(PKG_DIR, '.env'));
    });

    beforeEach(() => {
        // Launch from a neutral dir with no `.env`, so any successful load proves baseDir
        // (not cwd) did the resolving.
        process.chdir(os.tmpdir());
        // resetProfiles before clearing baseDir: a leftover relative profile would otherwise
        // re-resolve against cwd on the baseDir refresh and throw EnvFilesNotFound.
        Envapter.resetProfiles();
        Envapter.baseDir = undefined;
        Envapter.environment = Environment.Development;
    });

    afterEach(() => {
        process.chdir(originalCwd);
        Envapter.resetProfiles();
        Envapter.baseDir = undefined;
    });

    describe('accepts', () => {
        it('a plain directory path', () => {
            Envapter.baseDir = PKG_DIR;
            expect(Envapter.baseDir).to.equal(PKG_DIR);
            expect(Envapter.get('BASEDIR_KEY')).to.equal('from-pkg-dev'); // .env.development wins
            expect(Envapter.get('PKG_ONLY')).to.equal('pkg-value');
        });

        it('a module URL string (import.meta.url shape)', () => {
            Envapter.baseDir = pathToFileURL(resolve(PKG_DIR, 'index.ts')).href;
            expect(Envapter.baseDir).to.equal(PKG_DIR);
            expect(Envapter.get('PKG_ONLY')).to.equal('pkg-value');
        });

        it('a URL object', () => {
            Envapter.baseDir = pathToFileURL(resolve(PKG_DIR, 'index.ts'));
            expect(Envapter.baseDir).to.equal(PKG_DIR);
            expect(Envapter.get('PKG_ONLY')).to.equal('pkg-value');
        });
    });

    describe('cascade resolution', () => {
        it('resolves the dotenv-flow cascade against baseDir, not cwd', () => {
            Envapter.baseDir = PKG_DIR;
            // .env.development.local > .env.development > .env.local > .env, all under PKG_DIR
            expect(Envapter.get('BASEDIR_DEV')).to.equal('dev-value');
            expect(Envapter.get('BASEDIR_KEY')).to.equal('from-pkg-dev');
        });
    });

    describe('explicit envPaths', () => {
        it('resolves a relative envPath against baseDir', () => {
            Envapter.baseDir = PKG_DIR;
            Envapter.envPaths = '.env.custom';
            expect(Envapter.get('CUSTOM_KEY')).to.equal('from-custom');
        });

        it('lets an absolute envPath bypass baseDir', () => {
            Envapter.baseDir = PKG_DIR;
            Envapter.envPaths = ABS_ENV;
            expect(Envapter.get('ABS_KEY')).to.equal('from-abs');
            expect(Envapter.get('PKG_ONLY')).to.be.undefined; // pkg dir ignored
        });

        it('throws EnvFilesNotFound when a relative envPath is missing under baseDir', () => {
            Envapter.baseDir = PKG_DIR;
            expect(() => (Envapter.envPaths = '.env.nope'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.EnvFilesNotFound);
        });

        it('validates a relative envPath at set-time, so baseDir must be set first', () => {
            // Set-time validation runs against the resolution base in effect at assignment.
            // With baseDir still unset, '.env.custom' validates against cwd (the no-`.env` tmpdir) and throws.
            expect(() => (Envapter.envPaths = '.env.custom'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.EnvFilesNotFound);
        });
    });

    describe('profiles', () => {
        it('resolves a relative configureProfiles path against baseDir', () => {
            Envapter.baseDir = PKG_DIR;
            Envapter.configureProfiles({
                [Environment.Development]: { paths: '.env.custom' },
                useDefaults: false
            });
            Envapter.environment = Environment.Development;
            expect(Envapter.get('CUSTOM_KEY')).to.equal('from-custom');
        });
    });

    describe('when unset', () => {
        it('falls back to process.cwd() resolution (historical default)', () => {
            process.chdir(PKG_DIR); // baseDir stays undefined; cwd does the work
            Envapter.resetProfiles(); // chdir alone doesn't invalidate the data cache
            expect(Envapter.baseDir).to.equal(undefined);
            expect(Envapter.get('PKG_ONLY')).to.equal('pkg-value');
        });
    });
});
