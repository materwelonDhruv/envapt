import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes } from '../src';
import { Validator } from '../src/engine/Validators';
import { EnvaptError } from '../src/infra/Error';
import { Envapt } from '../src/legacy';

import type { JsonValue } from '../src';

const nodeExists = (path: string): boolean => existsSync(path);

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

        it('throws InvalidCustomConverter for an undefined converter', () => {
            // cast past the type to reach the runtime check
            const removedToken = undefined as never;
            for (const read of [
                () => Envapter.getAs('VAR_IN_EXTRA_FILE', removedToken),
                () => {
                    class RemovedTokenField {
                        @Envapt('VAR_IN_EXTRA_FILE', { converter: removedToken })
                        static readonly value: unknown;
                    }
                    return RemovedTokenField.value;
                }
            ]) {
                expect(read).to.throw(EnvaptError).with.property('code', EnvaptErrorCodes.InvalidCustomConverter);
            }
        });
    });

    describe('ArrayOf validation (brand-based)', () => {
        it('should throw for values missing the ArrayOf brand', () => {
            const invalidConfigs = [{}, 'string', null, { delimiter: ',' }, { of: 'string', delimiter: ',' }];

            const testFunction = (config: unknown) => () => Validator.arrayConverter(config);

            invalidConfigs.forEach((config) => {
                expect(testFunction(config))
                    .to.throw(EnvaptError)
                    .with.property('code', EnvaptErrorCodes.InvalidArrayConverterType);
            });
        });

        it('should throw when a hand-rolled ArrayOf has an unknown `of` token', () => {
            // intentionally malformed for runtime validation -- justified
            const malformed = { __envaptKind: 'array', of: 'not-a-real-token', delimiter: ',' };
            expect(() => Validator.arrayConverter(malformed))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidArrayConverterType);
        });

        it('should throw when a hand-rolled ArrayOf has a missing or empty delimiter', () => {
            // intentionally malformed for runtime validation -- justified
            const missingDelimiter = { __envaptKind: 'array', of: 'string', delimiter: '' };
            expect(() => Validator.arrayConverter(missingDelimiter))
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
        it('should not throw for empty arrays', () => {
            expect(() => Validator.validateArrayConverterElementTypeMatch('string', [])).to.not.throw();
            expect(() => Validator.validateArrayConverterElementTypeMatch('number', [])).to.not.throw();
        });

        it('should accept TimeFallback[] (string[]) when element token is "time"', () => {
            expect(() => Validator.validateArrayConverterElementTypeMatch('time', ['5s', '10m'])).to.not.throw();
            expect(() => Validator.validateArrayConverterElementTypeMatch('time', [5000, 600000])).to.not.throw();
        });

        it('should throw for a time-array fallback that is neither all numbers nor all strings', () => {
            expect(() => Validator.validateArrayConverterElementTypeMatch('time', [{}, {}]))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);
        });

        it('should skip element-type validation when `of` is a custom function', () => {
            const customOf = (raw: string): number => Number(raw);
            expect(() => Validator.validateArrayConverterElementTypeMatch(customOf, [1, 2, 3])).to.not.throw();
        });
    });

    describe('dotenv config validation', () => {
        it('should reject removed dotenv config options (quiet, DOTENV_KEY)', () => {
            const removedConfigs = [{ quiet: true }, { DOTENV_KEY: 'test-key' }];

            for (const config of removedConfigs) {
                expect(() => Validator.validateEnvFileOptions(config))
                    .to.throw(EnvaptError)
                    .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
            }
        });

        it('should throw error for multiple invalid options', () => {
            const error = (() => {
                try {
                    Validator.validateEnvFileOptions({ invalidOption1: 'test', invalidOption2: 'test' });
                    return null;
                } catch (err) {
                    return err as EnvaptError;
                }
            })();

            expect(error).to.be.instanceOf(EnvaptError);
            expect(error?.code).to.equal(EnvaptErrorCodes.InvalidUserDefinedConfig);
            expect(error?.message).to.include('invalidOption1, invalidOption2');
        });
    });

    describe('env file validation', () => {
        it('should throw error for non-existent multiple files', () => {
            const error = (() => {
                try {
                    Validator.validateEnvFilesExist(['/non/existent/file1.env', '/non/existent/file2.env'], nodeExists);
                    return null;
                } catch (err) {
                    return err as EnvaptError;
                }
            })();

            expect(error).to.be.instanceOf(EnvaptError);
            expect(error?.code).to.equal(EnvaptErrorCodes.EnvFilesNotFound);
            expect(error?.message).to.include('/non/existent/file1.env, /non/existent/file2.env');
        });
    });
});
