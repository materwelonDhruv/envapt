import { resolve } from 'node:path';
import process from 'node:process';

import { afterEach, beforeAll, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { Envapter, EnvaptErrorCodes, NodeEnvSource } from '../src';
import { resetDebugForTesting } from '../src/infra/Debug';
import { loadDotenv } from '../src/infra/Dotenv';
import { EnvaptError } from '../src/infra/Error';

import type { DebugLevel } from '../src';

// loadDotenv takes an injected reader; reuse the library's Node reader rather than re-implementing fs.
const reader = new NodeEnvSource();
const nodeReadFile = reader.readFile.bind(reader);

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

function lastEnvaptLine(capture: StderrCapture): string | undefined {
    const envaptLines = capture.lines.filter((l) => l.includes('[envapt]'));
    return envaptLines.at(-1);
}

describe('Debug mode (v5)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
    });

    beforeEach(() => {
        delete process.env.ENVAPT_DEBUG;
        resetDebugForTesting();
    });

    afterEach(() => {
        resetDebugForTesting();
    });

    describe('Envapter.debug toggle', () => {
        it('defaults to silent', () => {
            expect(Envapter.debug).to.equal('silent');
        });

        it('round-trips set/get for each level', () => {
            Envapter.debug = 'warn';
            expect(Envapter.debug).to.equal('warn');
            Envapter.debug = 'verbose';
            expect(Envapter.debug).to.equal('verbose');
            Envapter.debug = 'silent';
            expect(Envapter.debug).to.equal('silent');
        });

        it('throws EnvaptError(InvalidUserDefinedConfig) on an invalid level', () => {
            expect(() => {
                Envapter.debug = 'loud' as DebugLevel;
            })
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });
    });

    describe('Lazy ENVAPT_DEBUG env-var resolution', () => {
        it('picks up ENVAPT_DEBUG when set and the setter has not run', () => {
            process.env.ENVAPT_DEBUG = 'verbose';
            expect(Envapter.debug).to.equal('verbose');
        });

        it('ignores invalid ENVAPT_DEBUG values, defaulting to silent', () => {
            process.env.ENVAPT_DEBUG = 'bogus';
            expect(Envapter.debug).to.equal('silent');
        });

        it('setter overrides the env var after first call', () => {
            process.env.ENVAPT_DEBUG = 'verbose';
            Envapter.debug = 'warn';
            expect(Envapter.debug).to.equal('warn');
        });
    });

    describe('silent (default) emits nothing', () => {
        it('does not log anything from get() on missing key with fallback', () => {
            const capture = captureStderr();
            try {
                Envapter.get('NEVER_SET_KEY', 'fallback');
                expect(capture.lines.some((l) => l.includes('[envapt]'))).to.equal(false);
            } finally {
                capture.restore();
            }
        });
    });

    describe('warn level', () => {
        it('logs when a fallback is used in place of a missing env value', () => {
            Envapter.debug = 'warn';
            const capture = captureStderr();
            try {
                Envapter.get('NEVER_SET_KEY', 'fallback');
                const line = lastEnvaptLine(capture);
                expect(line).to.exist;
                expect(line).to.include('NEVER_SET_KEY');
                expect(line).to.include('fallback');
            } finally {
                capture.restore();
            }
        });

        it('does NOT log when a key is found in the env (no fallback path)', () => {
            Envapter.debug = 'warn';
            const capture = captureStderr();
            try {
                Envapter.get('KNOWN_KEY');
                expect(capture.lines.some((l) => l.includes('[envapt]'))).to.equal(false);
            } finally {
                capture.restore();
            }
        });

        it('logs an unresolved template (non-strict path) preserved as literal', () => {
            Envapter.debug = 'warn';
            const capture = captureStderr();
            try {
                Envapter.get('TEMPLATED_UNRESOLVED');
                const found = capture.lines.find((l) => l.includes('ABSENT_KEY'));
                expect(found, 'expected an unresolved-template warn').to.exist;
            } finally {
                capture.restore();
            }
        });

        it('does NOT emit verbose-only lines (cache cleared / loaded files)', () => {
            Envapter.debug = 'warn';
            const capture = captureStderr();
            try {
                Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
                expect(capture.lines.some((l) => l.includes('cache cleared'))).to.equal(false);
                expect(capture.lines.some((l) => l.includes('effective .env paths'))).to.equal(false);
            } finally {
                capture.restore();
            }
        });
    });

    describe('verbose level', () => {
        it('logs effective .env paths during cache rebuild', () => {
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
                expect(capture.lines.some((l) => l.includes('effective .env paths'))).to.equal(true);
            } finally {
                capture.restore();
            }
        });

        it('logs "(none)" when the resolver returns zero effective paths', () => {
            // `configureProfiles({ useDefaults: false })` with no per-env profile entry
            // collapses the resolver to an empty array. Triggers the `(none)` arm.
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.resetProfiles();
                Envapter.configureProfiles({ useDefaults: false });
                expect(capture.lines.some((l) => l.includes('effective .env paths: (none)'))).to.equal(true);
            } finally {
                capture.restore();
                Envapter.resetProfiles();
                Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
            }
        });

        it('logs the cache-cleared line on refresh', () => {
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
                expect(capture.lines.some((l) => l.includes('cache cleared'))).to.equal(true);
            } finally {
                capture.restore();
            }
        });

        it('logs the per-file key count after a successful load', () => {
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
                expect(capture.lines.some((l) => /loaded .*: \d+ keys?/u.test(l))).to.equal(true);
            } finally {
                capture.restore();
            }
        });

        it('logs per-key load lines for each key from a file', () => {
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
                expect(capture.lines.some((l) => l.includes('-> KNOWN_KEY'))).to.equal(true);
            } finally {
                capture.restore();
            }
        });

        it('logs the configured base dir during cache rebuild', () => {
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.baseDir = import.meta.dirname;
                const dir = Envapter.baseDir;
                const line = capture.lines.find((l) => l.includes('base dir'));
                expect(line, 'expected a base dir line').to.exist;
                expect(line).to.include(dir);
            } finally {
                capture.restore();
                Envapter.baseDir = undefined;
            }
        });

        it('reports the working directory when no base dir is set', () => {
            Envapter.debug = 'verbose';
            Envapter.baseDir = undefined;
            const capture = captureStderr();
            try {
                Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
                const line = capture.lines.find((l) => l.includes('base dir'));
                expect(line, 'expected a base dir line').to.exist;
                expect(line).to.include('working directory');
            } finally {
                capture.restore();
            }
        });

        it('still emits warn-level lines (fallback used)', () => {
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.get('NEVER_SET_KEY', 'fallback');
                const line = lastEnvaptLine(capture);
                expect(line).to.include('NEVER_SET_KEY');
            } finally {
                capture.restore();
            }
        });
    });

    describe('Failed file reads (warn)', () => {
        // The envPaths setter validates that the file exists, so we hit the loader's
        // catch-and-warn path directly. This is the realistic case: a path slips past the
        // validator (e.g., race-deleted between checks) and the loader has to log + skip.
        it('emits a "could not read" warn when loadDotenv hits a missing file', () => {
            Envapter.debug = 'warn';
            const ghost = resolve(import.meta.dirname, '.env.does-not-exist-at-all');
            const capture = captureStderr();
            try {
                loadDotenv({ path: ghost, processEnv: {}, readFile: nodeReadFile });
                const line = capture.lines.find((l) => l.includes(ghost));
                expect(line, 'expected a could-not-read warn').to.exist;
                expect(line).to.include('could not read');
            } finally {
                capture.restore();
            }
        });
    });

    describe('Compile-time type narrowing (expect-type)', () => {
        it('Envapter.debug is typed as DebugLevel', () => {
            const current = Envapter.debug;
            expectTypeOf(current).toEqualTypeOf<DebugLevel>();
            expectTypeOf<DebugLevel>().toEqualTypeOf<'silent' | 'warn' | 'verbose'>();
        });
    });
});
