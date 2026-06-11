import { resolve } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { Converters, Envapt, EnvaptError, EnvaptErrorCodes, Envapter } from '../src';

import type { TimeFallback } from '../src';

describe('Converters.Time — time-string fallbacks', () => {
    beforeEach(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.builtin-test`)));

    describe('valid time-string fallbacks (one per supported unit)', () => {
        class Strings extends Envapter {
            // Each TEST_TIME_STRING_FALLBACK_* key is intentionally absent from the
            // fixture file so the string-fallback path is exercised.
            @Envapt('TEST_TIME_STRING_FALLBACK_MS', { converter: Converters.Time, fallback: '1500ms' })
            static readonly ms: number;

            @Envapt('TEST_TIME_STRING_FALLBACK_S', { converter: Converters.Time, fallback: '2s' })
            static readonly s: number;

            @Envapt('TEST_TIME_STRING_FALLBACK_M', { converter: Converters.Time, fallback: '10m' })
            static readonly m: number;

            @Envapt('TEST_TIME_STRING_FALLBACK_H', { converter: Converters.Time, fallback: '3h' })
            static readonly h: number;

            @Envapt('TEST_TIME_STRING_FALLBACK_D', { converter: Converters.Time, fallback: '1d' })
            static readonly d: number;

            @Envapt('TEST_TIME_STRING_FALLBACK_W', { converter: Converters.Time, fallback: '1w' })
            static readonly w: number;

            @Envapt('TEST_TIME_STRING_FALLBACK_DECIMAL', { converter: Converters.Time, fallback: '1.5h' })
            static readonly decimal: number;
        }

        it('parses ms', () => expect(Strings.ms).to.equal(1500));
        it('parses s', () => expect(Strings.s).to.equal(2 * 1000));
        it('parses m', () => expect(Strings.m).to.equal(10 * 60 * 1000));
        it('parses h', () => expect(Strings.h).to.equal(3 * 60 * 60 * 1000));
        it('parses d', () => expect(Strings.d).to.equal(24 * 60 * 60 * 1000));
        it('parses w', () => expect(Strings.w).to.equal(7 * 24 * 60 * 60 * 1000));
        // Decimals parse the same as a raw value; the only string-fallback constraint is the explicit unit.
        it('parses a decimal value', () => expect(Strings.decimal).to.equal(1.5 * 60 * 60 * 1000));
    });

    describe('absent fallback', () => {
        class NoFallback extends Envapter {
            // Env value is malformed (`TEST_TIME_INVALID=5x` in the fixture) and no fallback
            // is provided — converter returns undefined, decorator surfaces it as null.
            @Envapt('TEST_TIME_INVALID', { converter: Converters.Time })
            static readonly noFallback: number | null;
        }

        it('returns null when raw is malformed and no fallback is provided', () => {
            expect(NoFallback.noFallback).to.be.null;
        });
    });

    describe('malformed time-string fallbacks', () => {
        it('throws MalformedTimeFallback for a bogus string fallback', () => {
            class BogusFallback extends Envapter {
                // 'bogus' isn't a valid TimeFallback — cast to bypass the compile-time guard
                // so we can exercise the runtime throw path (JS callers / dynamic strings).
                @Envapt('UNDEFINED_TIME_FOR_BOGUS_FALLBACK', {
                    converter: Converters.Time,
                    fallback: 'bogus' as unknown as TimeFallback
                })
                static readonly bogus: number;
            }

            expect(() => BogusFallback.bogus)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MalformedTimeFallback);
        });

        it('throws MalformedTimeFallback for a unit-less time-string', () => {
            class UnitLessFallback extends Envapter {
                // The TimeFallback type rejects '1500' (TimeUnit is required in the template).
                // Cast to bypass for the runtime-throw check.
                @Envapt('UNDEFINED_TIME_FOR_UNITLESS_FALLBACK', {
                    converter: Converters.Time,
                    fallback: '1500' as unknown as TimeFallback
                })
                static readonly unitless: number;
            }

            expect(() => UnitLessFallback.unitless)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MalformedTimeFallback);
        });
    });
});
