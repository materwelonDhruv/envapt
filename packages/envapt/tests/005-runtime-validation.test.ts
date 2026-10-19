import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptError, EnvaptErrorCodes } from '../src';
import { Envapt } from '../src/legacy';

import type { JsonValue } from '../src';

describe('Runtime Validation', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.extra')));

    describe('converter validation', () => {
        it('throws InvalidBuiltInConverter with the valid tokens for a mistyped token', () => {
            // @ts-expect-error a mistyped token
            expect(() => Envapter.getAs('VAR_IN_EXTRA_FILE', 'nmber'))
                .to.throw(EnvaptError, 'Valid types are: string,number')
                .with.property('code', EnvaptErrorCodes.InvalidBuiltInConverter);
        });

        it('throws InvalidBuiltInConverter for a mistyped converter even when the key is unset', () => {
            // cast past the type to reach the runtime check
            const typo = 'nmber' as never;
            for (const read of [
                () => Envapter.getAs('NEVER_SET_KEY', typo),
                () => Envapter.getRequired('NEVER_SET_KEY', typo),
                () => Envapter.getRequiredAll({ NEVER_SET_KEY: typo })
            ]) {
                expect(read).to.throw(EnvaptError).with.property('code', EnvaptErrorCodes.InvalidBuiltInConverter);
            }
        });

        it('throws InvalidCustomConverter for a converter that is neither a token nor a function', () => {
            // cast past the type to reach the runtime check
            expect(() => Envapter.getAs('VAR_IN_EXTRA_FILE', 42 as never))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidCustomConverter);
        });

        it('reads an explicit `converter: undefined` on @Envapt the same as no converter', () => {
            class OptionalConverter {
                @Envapt('NEVER_SET_KEY', { fallback: 3000, converter: undefined })
                static readonly port: number;
            }
            expect(OptionalConverter.port).to.equal(3000);
        });

        it('throws InvalidCustomConverter for an undefined getAs converter', () => {
            // cast past the type to reach the runtime check
            expect(() => Envapter.getAs('VAR_IN_EXTRA_FILE', undefined as never))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidCustomConverter);
        });
    });

    describe('ArrayOf validation', () => {
        it('throws InvalidArrayConverterType for an unknown `of` token', () => {
            // cast past the type to reach the runtime check
            const unknownOf = Converters.array({ of: 'not-a-real-token' as never });
            expect(() => Envapter.getAs('VAR_IN_EXTRA_FILE', unknownOf))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidArrayConverterType);
        });

        it('throws MissingDelimiter for an empty delimiter', () => {
            expect(() => Envapter.getAs('VAR_IN_EXTRA_FILE', Converters.array({ delimiter: '' })))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingDelimiter);
        });
    });

    describe('Converter fallback validation', () => {
        class FallbackTests {
            @Envapt('NONEXISTENT_ARRAY_VAR', {
                // @ts-expect-error fallback must be string[] to match `of: Converters.String`
                converter: Converters.array(),
                fallback: 'not-an-array'
            })
            static readonly invalidArrayFallback: string | undefined;

            @Envapt('NONEXISTENT_ARRAY_VAR', {
                converter: Converters.array()
            })
            static readonly noFallbackArray: string[] | undefined;
        }

        it('should throw error when ArrayOf is used with non-array fallback for missing env var', () => {
            expect(() => FallbackTests.invalidArrayFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidFallback);
        });

        it('should return undefined when ArrayOf is used without fallback for missing env var', () => {
            expect(FallbackTests.noFallbackArray).to.be.undefined;
        });
    });

    describe('Fallback type validation for built-in converters', () => {
        class FallbackTypeValidationTests {
            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_STRING_VAR', { converter: Converters.String, fallback: 42 })
            static readonly stringWithNumberFallback: string;

            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_NUMBER_VAR', { converter: Converters.Number, fallback: 'not-a-number' })
            static readonly numberWithStringFallback: number;

            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_BOOLEAN_VAR', { converter: Converters.Boolean, fallback: 'not-a-boolean' })
            static readonly booleanWithStringFallback: boolean;

            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_BIGINT_VAR', { converter: Converters.BigInt, fallback: 42 })
            static readonly bigintWithNumberFallback: bigint;

            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_URL_VAR', { converter: Converters.Url, fallback: 'not-a-url-object' })
            static readonly urlWithStringFallback: URL;

            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_REGEXP_VAR', { converter: Converters.RegExp, fallback: 'not-a-regexp-object' })
            static readonly regexpWithStringFallback: RegExp;

            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_DATE_VAR', { converter: Converters.Date, fallback: 'not-a-date-object' })
            static readonly dateWithStringFallback: Date;

            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_TIME_VAR', { converter: Converters.Time, fallback: 'not-a-number' })
            static readonly timeWithStringFallback: number;

            // @ts-expect-error Inconsistent fallback type
            @Envapt('NONEXISTENT_JSON_VAR', { converter: Converters.Json, fallback: Symbol('not-a-json') })
            static readonly jsonWithStringFallback: JsonValue;
        }

        it('should throw when string converter has non-string fallback', () => {
            expect(() => FallbackTypeValidationTests.stringWithNumberFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('should throw when number converter has non-number fallback', () => {
            expect(() => FallbackTypeValidationTests.numberWithStringFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('should throw when boolean converter has non-boolean fallback', () => {
            expect(() => FallbackTypeValidationTests.booleanWithStringFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('should throw when bigint converter has non-bigint fallback', () => {
            expect(() => FallbackTypeValidationTests.bigintWithNumberFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('should throw when URL converter has non-URL fallback', () => {
            expect(() => FallbackTypeValidationTests.urlWithStringFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('should throw when RegExp converter has non-RegExp fallback', () => {
            expect(() => FallbackTypeValidationTests.regexpWithStringFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('should throw when Date converter has non-Date fallback', () => {
            expect(() => FallbackTypeValidationTests.dateWithStringFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('should throw MalformedTimeFallback when time converter has a malformed string fallback', () => {
            expect(() => FallbackTypeValidationTests.timeWithStringFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MalformedTimeFallback);
        });

        it('should throw when JSON converter has non-JSON fallback', () => {
            expect(() => FallbackTypeValidationTests.jsonWithStringFallback)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });
    });

    describe('Fallback value validation for built-in converters', () => {
        it('rejects a non-safe-integer integer fallback', () => {
            expect(() => Envapter.getAs('NONEXISTENT_INT_FB', Converters.Integer, Number.MAX_SAFE_INTEGER + 1))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('rejects a NaN number fallback', () => {
            expect(() => Envapter.getAs('NONEXISTENT_NUM_FB', Converters.Number, NaN))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('rejects a NaN float fallback but keeps Infinity', () => {
            expect(() => Envapter.getAs('NONEXISTENT_FLOAT_FB', Converters.Float, NaN))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
            expect(Envapter.getAs('NONEXISTENT_FLOAT_FB', Converters.Float, Infinity)).to.equal(Infinity);
        });

        it('rejects an Invalid Date fallback', () => {
            expect(() => Envapter.getAs('NONEXISTENT_DATE_FB', Converters.Date, new Date('not-a-date')))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });
    });

    describe('Array converter fallback element type validation', () => {
        class ArrayConverterValidationTests {
            @Envapt('NONEXISTENT_ARRAY_VAR', {
                // @ts-expect-error mixed-type fallback array; `42` doesn't fit `of: Converters.String`
                converter: Converters.array({ of: Converters.String }),
                fallback: ['string', 42, 'another-string']
            })
            static readonly arrayWithMixedTypeElements: string | undefined;

            @Envapt('NONEXISTENT_ARRAY_VAR', {
                // @ts-expect-error fallback element types don't match the declared `of` token
                converter: Converters.array({ of: Converters.Number }),
                fallback: ['not-a-number', 'also-not-a-number']
            })
            static readonly arrayWithWrongElementType: string | undefined;
        }

        it('should throw when array converter fallback has mixed element types', () => {
            expect(() => ArrayConverterValidationTests.arrayWithMixedTypeElements)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);
        });

        it('should throw when array converter type does not match fallback element type', () => {
            expect(() => ArrayConverterValidationTests.arrayWithWrongElementType)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);
        });
    });

    describe('Array converter element type validation', () => {
        it('throws for a time-array fallback that is neither all numbers nor all strings', () => {
            // cast past the type to reach the runtime check
            const mixed = [{}, {}] as never;
            expect(() => Envapter.getAs('NEVER_SET_KEY', Converters.array({ of: Converters.Time }), mixed))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);
        });

        it('skips element-type validation when `of` is a custom function', () => {
            const customOf = (raw: string): number => Number(raw);
            expect(Envapter.getAs('NEVER_SET_KEY', Converters.array({ of: customOf }), [1, 2, 3])).to.deep.equal([
                1, 2, 3
            ]);
        });
    });

    describe('.env file option validation', () => {
        it('rejects removed dotenv options (quiet, DOTENV_KEY)', () => {
            // cast past the type to reach the runtime check
            for (const options of [{ quiet: true }, { DOTENV_KEY: 'test-key' }] as never[]) {
                expect(() => (Envapter.envFileOptions = options))
                    .to.throw(EnvaptError)
                    .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
            }
        });

        it('lists every invalid option in one error', () => {
            // cast past the type to reach the runtime check
            const options = { invalidOption1: 'test', invalidOption2: 'test' } as never;
            expect(() => (Envapter.envFileOptions = options))
                .to.throw(EnvaptError, 'invalidOption1, invalidOption2')
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });
    });

    describe('env file validation', () => {
        it('lists every missing file in one EnvFilesNotFound', () => {
            expect(() => (Envapter.envPaths = ['/non/existent/file1.env', '/non/existent/file2.env']))
                .to.throw(EnvaptError, '/non/existent/file1.env, /non/existent/file2.env')
                .with.property('code', EnvaptErrorCodes.EnvFilesNotFound);
        });
    });
});
