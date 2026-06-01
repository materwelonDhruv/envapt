import { resolve } from 'node:path';
import process from 'node:process';

import { expect } from 'chai';
import { afterEach, beforeAll, beforeEach, describe, it, vi } from 'vitest';

import { Envapter, EnvaptErrorCodes } from '../src';
import { resetDebugForTesting } from '../src/Debug';
import { EnvaptError } from '../src/Error';

const FIXTURE_KEYS = ['SYNC_KEY_A', 'SYNC_KEY_B', 'SYNC_KEY_COLLISION'] as const;
const FIXTURE_PATH = resolve(import.meta.dirname, '.env.sync-process-env');

function cleanFixtureKeys(): void {
    for (const k of FIXTURE_KEYS) Reflect.deleteProperty(process.env, k);
}

interface StderrCapture {
    lines: string[];
    restore: () => void;
}

function captureStderr(): StderrCapture {
    const lines: string[] = [];
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
        lines.push(typeof chunk === 'string' ? chunk : String(chunk));
        return true;
    });
    return { lines, restore: () => spy.mockRestore() };
}

describe('syncProcessEnv (v5)', () => {
    beforeAll(() => {
        Envapter.envPaths = FIXTURE_PATH;
    });

    beforeEach(() => {
        // Scrub fixture keys BEFORE rebuilding the cache so the loader observes a clean
        // process.env snapshot and tracks every fixture key as added.
        Envapter.syncProcessEnv = false;
        Envapter.envFileOptions = {};
        cleanFixtureKeys();
        Envapter.envPaths = FIXTURE_PATH;
    });

    afterEach(() => {
        Envapter.syncProcessEnv = false;
        Envapter.envFileOptions = {};
        cleanFixtureKeys();
        resetDebugForTesting();
    });

    describe('Envapter.syncProcessEnv toggle', () => {
        it('defaults to false', () => {
            expect(Envapter.syncProcessEnv).to.equal(false);
        });

        it('round-trips set/get', () => {
            Envapter.syncProcessEnv = true;
            expect(Envapter.syncProcessEnv).to.equal(true);
            Envapter.syncProcessEnv = false;
            expect(Envapter.syncProcessEnv).to.equal(false);
        });

        it('throws EnvaptError(InvalidUserDefinedConfig) on a non-boolean value', () => {
            const cases: unknown[] = ['true', 1, 0, null, undefined, {}];
            for (const bad of cases) {
                expect(() => {
                    // pragmatic cast: the whole point is asserting the setter rejects non-boolean -- justified
                    Envapter.syncProcessEnv = bad as boolean;
                })
                    .to.throw(EnvaptError)
                    .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
            }
        });
    });

    describe('off (default) does not touch process.env', () => {
        it('leaves dotenv-loaded keys absent from process.env even after reads', () => {
            expect(Envapter.get('SYNC_KEY_A')).to.equal('value-a');
            expect(Envapter.get('SYNC_KEY_B')).to.equal('value-b');
            expect(process.env.SYNC_KEY_A).to.equal(undefined);
            expect(process.env.SYNC_KEY_B).to.equal(undefined);
            expect(process.env.SYNC_KEY_COLLISION).to.equal(undefined);
        });
    });

    describe('on: late toggle after cache is populated', () => {
        it('mirrors the tracked delta immediately without refreshing the cache', () => {
            expect(process.env.SYNC_KEY_A).to.equal(undefined);
            Envapter.syncProcessEnv = true;
            expect(process.env.SYNC_KEY_A).to.equal('value-a');
            expect(process.env.SYNC_KEY_B).to.equal('value-b');
            expect(process.env.SYNC_KEY_COLLISION).to.equal('from-file');
        });
    });

    describe('on: flag set before cache build', () => {
        it('mirrors keys on the first cache build after the flag goes on', () => {
            // Wipe between the setter mirror and the rebuild so the assertions can only
            // pass if the config-getter mirror path fires too.
            Envapter.syncProcessEnv = true;
            cleanFixtureKeys();
            Envapter.envPaths = FIXTURE_PATH;
            expect(process.env.SYNC_KEY_A).to.equal('value-a');
            expect(process.env.SYNC_KEY_B).to.equal('value-b');
        });
    });

    describe('collision with first-wins (override: false, default)', () => {
        it('preserves a pre-existing process.env value and does not mirror the file value', () => {
            cleanFixtureKeys();
            process.env.SYNC_KEY_COLLISION = 'from-shell';
            Envapter.envPaths = FIXTURE_PATH;
            Envapter.syncProcessEnv = true;
            expect(process.env.SYNC_KEY_COLLISION).to.equal('from-shell');
            expect(process.env.SYNC_KEY_A).to.equal('value-a');
        });
    });

    describe('collision with override: true', () => {
        it('overwrites the pre-existing process.env value with the file value', () => {
            cleanFixtureKeys();
            process.env.SYNC_KEY_COLLISION = 'from-shell';
            Envapter.envFileOptions = { override: true };
            Envapter.envPaths = FIXTURE_PATH;
            Envapter.syncProcessEnv = true;
            expect(process.env.SYNC_KEY_COLLISION).to.equal('from-file');
        });
    });

    describe('irreversibility', () => {
        it('flipping true to false leaves already-mirrored keys in process.env', () => {
            Envapter.syncProcessEnv = true;
            expect(process.env.SYNC_KEY_A).to.equal('value-a');
            Envapter.syncProcessEnv = false;
            expect(process.env.SYNC_KEY_A).to.equal('value-a');
            expect(process.env.SYNC_KEY_B).to.equal('value-b');
        });

        it('refreshCache after a mirror is additive: keys from a prior load remain in process.env', () => {
            Envapter.syncProcessEnv = true;
            expect(process.env.SYNC_KEY_A).to.equal('value-a');
            Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
            // SYNC_KEY_A drops out of the new tracked delta but stays in process.env
            // because the mirror is one-way.
            expect(process.env.SYNC_KEY_A).to.equal('value-a');
        });
    });

    describe('verbose debug logging', () => {
        it('emits per-key and summary mirror lines when verbose', () => {
            Envapter.debug = 'verbose';
            cleanFixtureKeys();
            const capture = captureStderr();
            try {
                Envapter.syncProcessEnv = true;
                const perKey = capture.lines.find((l) => l.includes('mirrored SYNC_KEY_A to process.env'));
                const summary = capture.lines.find((l) => /mirrored \d+ keys to process.env/u.test(l));
                expect(perKey, 'expected a per-key mirror line').to.exist;
                expect(summary, 'expected a summary mirror line').to.exist;
            } finally {
                capture.restore();
            }
        });

        it('emits nothing mirror-related when silent', () => {
            cleanFixtureKeys();
            const capture = captureStderr();
            try {
                Envapter.syncProcessEnv = true;
                expect(capture.lines.some((l) => l.includes('mirrored'))).to.equal(false);
            } finally {
                capture.restore();
            }
        });

        it('skips the loop and emits no mirror lines when the tracked delta is empty', () => {
            // Pre-populate every fixture key so default override:false skips every loader
            // write and the tracked delta lands empty.
            process.env.SYNC_KEY_A = 'shell-a';
            process.env.SYNC_KEY_B = 'shell-b';
            process.env.SYNC_KEY_COLLISION = 'shell-c';
            Envapter.envPaths = FIXTURE_PATH;
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.syncProcessEnv = true;
                expect(capture.lines.some((l) => l.includes('mirrored'))).to.equal(false);
                expect(process.env.SYNC_KEY_A).to.equal('shell-a');
            } finally {
                capture.restore();
            }
        });
    });
});
