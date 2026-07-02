import { resolve } from 'node:path';

import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Converters, Envapter } from '../src';
import { Envapt } from '../src/legacy';

// A rejected value returns undefined from the converter, which the decorator replaces with the fallback.
// The fallbacks (99, 1.5) are values no leading-number parse of the fixtures would produce, so a loose
// parse would surface the wrong number and fail these assertions instead of passing.
describe('Numeric converter strictness (v8)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.038-numeric-strictness');
    });

    describe('integer', () => {
        class Ints {
            @Envapt('INT_VALID', { converter: Converters.Integer, fallback: 0 })
            static readonly valid: number;

            @Envapt('INT_NEGATIVE', { converter: Converters.Integer, fallback: 0 })
            static readonly negative: number;

            @Envapt('INT_GARBAGE', { converter: Converters.Integer, fallback: 99 })
            static readonly garbage: number;

            @Envapt('INT_FLOATLIKE', { converter: Converters.Integer, fallback: 99 })
            static readonly floatlike: number;

            @Envapt('INT_UNSAFE', { converter: Converters.Integer, fallback: 99 })
            static readonly unsafe: number;

            @Envapt('INT_WHITESPACE', { converter: Converters.Integer, fallback: 5 })
            static readonly whitespace: number;
        }

        it('reads a plain integer', () => {
            expect(Ints.valid).to.equal(42);
            expectTypeOf(Ints.valid).toEqualTypeOf<number>();
        });

        it('reads a negative integer', () => {
            expect(Ints.negative).to.equal(-7);
        });

        it('falls back on a value with trailing non-digits', () => {
            expect(Ints.garbage).to.equal(99);
        });

        it('falls back on a non-integer', () => {
            expect(Ints.floatlike).to.equal(99);
        });

        it('falls back on a magnitude past the safe-integer range', () => {
            expect(Ints.unsafe).to.equal(99);
        });

        it('falls back on whitespace', () => {
            expect(Ints.whitespace).to.equal(5);
        });
    });

    describe('float', () => {
        class Floats {
            @Envapt('FLOAT_VALID', { converter: Converters.Float, fallback: 0 })
            static readonly valid: number;

            @Envapt('FLOAT_SCI', { converter: Converters.Float, fallback: 0 })
            static readonly sci: number;

            @Envapt('FLOAT_INFINITY', { converter: Converters.Float, fallback: 0 })
            static readonly infinity: number;

            @Envapt('FLOAT_GARBAGE', { converter: Converters.Float, fallback: 99 })
            static readonly garbage: number;

            @Envapt('FLOAT_WHITESPACE', { converter: Converters.Float, fallback: 1.5 })
            static readonly whitespace: number;
        }

        it('reads a decimal', () => {
            expect(Floats.valid).to.equal(3.14);
            expectTypeOf(Floats.valid).toEqualTypeOf<number>();
        });

        it('reads scientific notation', () => {
            expect(Floats.sci).to.equal(1000);
        });

        it('keeps Infinity, matching the number converter', () => {
            expect(Floats.infinity).to.equal(Number.POSITIVE_INFINITY);
        });

        it('falls back on a value with trailing non-numeric characters', () => {
            expect(Floats.garbage).to.equal(99);
        });

        it('falls back on whitespace', () => {
            expect(Floats.whitespace).to.equal(1.5);
        });
    });
});
