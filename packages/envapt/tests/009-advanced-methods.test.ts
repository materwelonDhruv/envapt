import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter } from '../src';

describe('Advanced Converter Methods', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.builtin-test')));

    describe('getUsing method', () => {
        it('should convert using Converters enum - Number', () => {
            const result = Envapter.getUsing('TEST_NUMBER', Converters.Number);
            expect(result).to.equal(42.5);
            expect(typeof result).to.equal('number');
        });

        it('should convert using string converter name - Boolean', () => {
            const result = Envapter.getUsing('TEST_BOOLEAN', 'boolean');
            expect(result).to.be.true;
            expect(typeof result).to.equal('boolean');
        });

        it('should convert using Converters enum - Json', () => {
            const result = Envapter.getUsing<{ name: string; version: number; enabled: boolean }>(
                'TEST_JSON_OBJECT',
                Converters.Json
            );
            expect(result).to.deep.equal({ name: 'test', version: 1, enabled: true });
        });

        it('should convert using Converters.array() default', () => {
            const result = Envapter.getUsing('TEST_ARRAY_COMMA', Converters.array());
            expect(result).to.deep.equal(['item1', 'item2', 'item3']);
        });

        it('should convert using array converter with custom delimiter', () => {
            const result = Envapter.getUsing('TEST_ARRAY_SPACE', Converters.array({ delimiter: ' ' }));
            expect(result).to.deep.equal(['one', 'two', 'three']);
        });

        it('should convert using array converter with type conversion', () => {
            const result = Envapter.getUsing(
                'TEST_ARRAY_NUMBERS',
                Converters.array({ of: Converters.Number, delimiter: ',' })
            );
            expect(result).to.deep.equal([1, 2, 3]);
        });

        it('should convert using Converters enum - Url', () => {
            const result = Envapter.getUsing('TEST_URL_VALID', Converters.Url);
            expect(result).to.be.instanceOf(URL);
            expect(result?.toString()).to.equal('https://api.example.com/v1');
        });

        it('should convert using Converters enum - Regexp', () => {
            const result = Envapter.getUsing('TEST_REGEXP_WITH_FLAGS', Converters.Regexp, /[a-z]+/gi);
            expect(result).to.be.instanceOf(RegExp);
            expect(result.source).to.equal('[a-z]+');
            expect(result.flags).to.equal('gi');
        });

        it('should convert using Converters enum - Date', () => {
            const result = Envapter.getUsing('TEST_DATE_ISO', Converters.Date);
            expect(result).to.be.instanceOf(Date);
            expect(result?.toISOString()).to.equal('2023-12-25T00:00:00.000Z');
        });

        it('should convert using Converters enum - Time', () => {
            const result = Envapter.getUsing('TEST_TIME_SECONDS', Converters.Time);
            expect(result).to.equal(5000); // 5s converted to milliseconds
        });

        it('should convert using Converters enum - BigInt', () => {
            const result = Envapter.getUsing('TEST_BIGINT', Converters.BigInt);
            expect(result).to.equal(123456789012345678901234567890n);
            expect(typeof result).to.equal('bigint');
        });

        it('should use fallback for nonexistent variable', () => {
            const result = Envapter.getUsing('NONEXISTENT_VAR', Converters.Number, 42);
            expect(result).to.equal(42);
        });

        it('should return undefined for nonexistent variable without fallback', () => {
            const result = Envapter.getUsing('NONEXISTENT_VAR', Converters.String);
            expect(result).to.be.undefined;
        });
    });

    describe('getUsing method', () => {
        const splitTrimmed = (raw: string): string[] => raw.split(',').map((item) => item.trim());

        it('should convert using custom converter function', () => {
            const result = Envapter.getUsing('TEST_ARRAY_COMMA', (raw) =>
                splitTrimmed(raw).map((item) => item.toUpperCase())
            );
            expect(result).to.deep.equal(['ITEM1', 'ITEM2', 'ITEM3']);
        });

        it('should convert to Map using custom converter', () => {
            const toMap = (raw: string): Map<string, number> =>
                new Map(splitTrimmed(raw).map((item) => [item, item.length]));

            const result = Envapter.getUsing('TEST_ARRAY_COMMA', toMap, new Map([['default', 0]]));
            expect([...result]).to.deep.equal([
                ['item1', 5],
                ['item2', 5],
                ['item3', 5]
            ]);
        });

        it('should work with complex custom converter', () => {
            const result = Envapter.getUsing('TEST_ARRAY_COMMA', (raw) => {
                const items = splitTrimmed(raw);
                return { count: items.length, items, reversed: [...items].reverse() };
            });
            expect(result).to.deep.equal({
                count: 3,
                items: ['item1', 'item2', 'item3'],
                reversed: ['item3', 'item2', 'item1']
            });
        });

        it('should convert to Set using custom converter', () => {
            const result = Envapter.getUsing('TEST_ARRAY_COMMA', (raw) => new Set(splitTrimmed(raw)));
            expect(result).to.be.instanceOf(Set);
            expect(Array.from(result as Set<string>)).to.deep.equal(['item1', 'item2', 'item3']);
        });

        it('returns the fallback for a missing value without calling the converter', () => {
            expect(Envapter.getUsing('NONEXISTENT_VAR', (raw) => raw.length, 99)).to.equal(99);
        });

        it('returns undefined for a missing value with no fallback', () => {
            expect(Envapter.getUsing('NONEXISTENT_VAR', (raw) => raw.length)).to.be.undefined;
        });

        it('returns the fallback when the converter returns undefined or null', () => {
            const toMode = (raw: string): 'fast' | undefined => (raw === 'fast' ? 'fast' : undefined);
            expect(Envapter.getUsing('TEST_STRING', toMode, 'fast')).to.equal('fast');
            const toName = (raw: string): string | null => (raw === 'x' ? raw : null);
            expect(Envapter.getUsing('TEST_STRING', toName, 'fallback')).to.equal('fallback');
        });

        it("passes the converter's own error through", () => {
            const parsePositive = (raw: string): number => {
                throw new Error(`${raw} is not positive`);
            };
            expect(() => Envapter.getUsing('TEST_STRING', parsePositive)).to.throw('hello world is not positive');
        });
    });

    describe('error handling', () => {
        it('should throw error for invalid built-in converter', () => {
            expect(() => {
                //@ts-expect-error We're passing an invalid type here for testing
                Envapter.getUsing('TEST_STRING', 'invalid-converter');
            }).to.throw();
        });

        it('should accept Converters.array() and reject malformed ArrayOf tokens at runtime', () => {
            expect(() => {
                Envapter.getUsing('TEST_STRING', Converters.array());
            }).to.not.throw();

            expect(() => {
                // intentionally malformed for runtime validation -- justified
                Envapter.getUsing('TEST_STRING', {
                    __envaptKind: 'array',
                    of: 'invalid',
                    delimiter: ','
                } as unknown as ReturnType<typeof Converters.array>);
            }).to.throw();
        });

        it('should throw error for invalid custom converter', () => {
            expect(() => {
                //@ts-expect-error We're passing an invalid type here for testing
                Envapter.getUsing('TEST_STRING', 'not-a-function');
            }).to.throw();
        });
    });

    describe('type inference', () => {
        it('should infer correct types for built-in converters', () => {
            const str = Envapter.getUsing('TEST_STRING', Converters.String);
            const num = Envapter.getUsing('TEST_NUMBER', Converters.Number);
            const bool = Envapter.getUsing('TEST_BOOLEAN', Converters.Boolean);
            const arr = Envapter.getUsing('TEST_ARRAY_COMMA', Converters.array());

            const strWithFallback = Envapter.getUsing('TEST_STRING', Converters.String, 'default');
            const numWithFallback = Envapter.getUsing('TEST_NUMBER', Converters.Number, 0);

            expect(str).to.be.a('string');
            expect(num).to.be.a('number');
            expect(bool).to.be.a('boolean');
            expect(arr).to.be.an('array');
            expect(strWithFallback).to.be.a('string');
            expect(numWithFallback).to.be.a('number');
        });

        it('should work with template resolution', () => {
            const result = Envapter.getUsing('TEST_STRING', Converters.String);
            expect(result).to.equal('hello world');
        });
    });
});
