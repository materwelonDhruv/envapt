import { resolve } from 'node:path';
import process from 'node:process';

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Converters, Envapter, EnvaptError, EnvaptErrorCodes, FileSource, PortableSource } from '../src';
import { resetDebugForTesting } from '../src/infra/Debug';

import type { DebugLevel, Source } from '../src';

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

        it('logs a missing key even without a fallback', () => {
            Envapter.debug = 'warn';
            const capture = captureStderr();
            try {
                Envapter.get('NEVER_SET_KEY');
                const line = capture.lines.find((l) => l.includes('NEVER_SET_KEY'));
                expect(line, 'expected a not-found warn').to.exist;
                expect(line).to.include('missing or empty');
            } finally {
                capture.restore();
            }
        });

        it('logs a missing key read through getAs (no fallback)', () => {
            Envapter.debug = 'warn';
            const capture = captureStderr();
            try {
                Envapter.getAs('NEVER_SET_KEY', 'number');
                const line = capture.lines.find((l) => l.includes('NEVER_SET_KEY'));
                expect(line, 'expected a not-found warn from getAs').to.exist;
                expect(line).to.include('missing or empty');
            } finally {
                capture.restore();
            }
        });

        it('reports a present-but-empty var as missing or empty', () => {
            Envapter.debug = 'warn';
            process.env.EMPTY_KEY_X = '';
            Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode'); // rebuild so the empty var is snapshotted
            const capture = captureStderr();
            try {
                Envapter.get('EMPTY_KEY_X');
                const line = capture.lines.find((l) => l.includes('EMPTY_KEY_X'));
                expect(line, 'expected a missing-or-empty warn').to.exist;
                expect(line).to.include('missing or empty');
            } finally {
                capture.restore();
                Reflect.deleteProperty(process.env, 'EMPTY_KEY_X');
                Envapter.envPaths = resolve(import.meta.dirname, '.env.debug-mode');
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
            // useDefaults: false with no profile entry leaves no paths
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.resetPaths();
                Envapter.configureProfiles({ useDefaults: false });
                expect(capture.lines.some((l) => l.includes('effective .env paths: (none)'))).to.equal(true);
            } finally {
                capture.restore();
                Envapter.resetPaths();
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

        it('logs a line when a present value fails to convert and the fallback is used', () => {
            Envapter.useSource(new PortableSource({ PORT: 'not-a-number', RETRIES: 'abc' }));
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                expect(Envapter.getAs('PORT', Converters.Number, 8080)).to.equal(8080);
                expect(Envapter.getAs('RETRIES', Converters.Integer, 3)).to.equal(3);

                expect(capture.lines.some((l) => l.includes('could not convert PORT as number'))).to.equal(true);
                expect(capture.lines.some((l) => l.includes('could not convert') && l.includes('RETRIES'))).to.equal(
                    true
                );
                // the raw value never appears, since it can be a secret
                expect(capture.lines.some((l) => l.includes('not-a-number') || l.includes('abc'))).to.equal(false);
            } finally {
                capture.restore();
                Envapter.useSource(new FileSource());
            }
        });

        it('omits "using the fallback" when the read has no fallback', () => {
            Envapter.useSource(new PortableSource({ PORT: 'not-a-number' }));
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                expect(Envapter.getAs('PORT', Converters.Number)).to.be.undefined;
                const line = capture.lines.find((l) => l.includes('could not convert') && l.includes('PORT'));
                expect(line, 'expected a convert-failure line').to.exist;
                expect(line).to.not.include('using the fallback');
            } finally {
                capture.restore();
                Envapter.useSource(new FileSource());
            }
        });

        it('does not log a convert-failure for a missing value', () => {
            Envapter.useSource(new PortableSource({}));
            Envapter.debug = 'verbose';
            const capture = captureStderr();
            try {
                Envapter.getAs('ABSENT', Converters.Number, 5);
                expect(capture.lines.some((l) => l.includes('could not convert'))).to.equal(false);
            } finally {
                capture.restore();
                Envapter.useSource(new FileSource());
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
        it('warns and skips a file that disappears after the existence check', () => {
            // the envPaths setter reads each file once to check it exists
            let ghostReads = 0;
            const source: Source = {
                supportsFiles: true,
                readVars: () => ({}),
                readFile: (path) => {
                    if (path === 'local.env') return 'FROM_LOCAL=yes';
                    if (path !== 'ghost.env') return undefined;
                    ghostReads += 1;
                    return ghostReads === 1 ? 'FROM_GHOST=yes' : undefined;
                },
                resolvePath: (_baseDir, candidate) => candidate,
                normalizeBaseDir: (value) => String(value),
                writeVars: () => {}
            };
            Envapter.debug = 'warn';
            Envapter.useSource(source);
            const capture = captureStderr();
            try {
                Envapter.envPaths = ['ghost.env', 'local.env'];
                expect(Envapter.get('FROM_LOCAL')).to.equal('yes');
                const line = capture.lines.find((l) => l.includes('ghost.env'));
                expect(line).to.include('could not read');
            } finally {
                capture.restore();
                Envapter.useSource(new FileSource());
            }
        });
    });
});
