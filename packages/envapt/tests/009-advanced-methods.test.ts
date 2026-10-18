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

        it('should convert using Converters enum - RegExp', () => {
            const result = Envapter.getUsing('TEST_REGEXP_WITH_FLAGS', Converters.RegExp, /[a-z]+/gi);
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
});
