import { resolve } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, type JsonValue } from '../src';
import { Envapt } from '../src/legacy';

describe('Built-in Converters', () => {
    beforeEach(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.builtin-test`)));

    describe('basic type converters', () => {
        class BasicTypeTest {
            @Envapt('TEST_STRING', { converter: Converters.String, fallback: 'default' })
            static readonly testString: string;
        }

        it('should handle string converter', () => {
            expect(BasicTypeTest.testString).to.equal('hello world');
        });
    });

    describe('array converters', () => {
        class ArrayTest {
            @Envapt('TEST_ARRAY_COMMA', { converter: Converters.array(), fallback: [] })
            static readonly arrayDefault: string[];

            @Envapt('TEST_ARRAY_SPACE', { converter: Converters.array({ delimiter: ' ' }), fallback: [] })
            static readonly arraySpace: string[];

            @Envapt('TEST_ARRAY_EMPTY', { converter: Converters.array(), fallback: ['default'] })
            static readonly arrayEmpty: string[];

            @Envapt('TEST_ARRAY_WHITESPACE_ONLY', { converter: Converters.array(), fallback: [] })
            static readonly arrayWhitespaceOnly: string[];

            @Envapt('TEST_ARRAY_COMMA_SPACE', { converter: Converters.array({ delimiter: ', ' }), fallback: [] })
            static readonly arrayCommaSpace: string[];

            @Envapt('NONEXISTENT_ARRAY', { converter: Converters.array(), fallback: ['fallback1', 'fallback2'] })
            static readonly nonexistentArray: string[];

            @Envapt('TEST_ARRAY_BOOLEANS', {
                converter: Converters.array({ of: Converters.Boolean, delimiter: ',' }),
                fallback: []
            })
            static readonly arrayBooleans: boolean[];

            @Envapt('TEST_ARRAY_TIME', {
                converter: Converters.array({ of: Converters.Time, delimiter: ',' }),
                fallback: []
            })
            static readonly arrayTime: number[];
        }

        it('should parse arrays with default delimiter (comma)', () => {
            expect(ArrayTest.arrayDefault).to.deep.equal(['item1', 'item2', 'item3']);
        });

        it('should parse space-separated arrays', () => {
            expect(ArrayTest.arraySpace).to.deep.equal(['one', 'two', 'three']);
        });

        it('should parse comma-space-separated arrays', () => {
            expect(ArrayTest.arrayCommaSpace).to.deep.equal(['apple', 'banana', 'cherry']);
        });

        it('should handle empty arrays', () => {
            expect(ArrayTest.arrayEmpty).to.deep.equal(['default']);
        });

        it('should handle whitespace-only arrays as empty', () => {
            expect(ArrayTest.arrayWhitespaceOnly).to.deep.equal([]);
        });

        it('should use fallback for nonexistent arrays', () => {
            expect(ArrayTest.nonexistentArray).to.deep.equal(['fallback1', 'fallback2']);
        });

        it('should convert array elements to booleans', () => {
            expect(ArrayTest.arrayBooleans).to.deep.equal([true, false, true]);
        });

        it('should convert array elements to time in milliseconds', () => {
            // 5ms, 5s, 5m, 5h
            expect(ArrayTest.arrayTime).to.deep.equal([5, 5000, 300000, 18000000]);
        });
    });

    describe('json converter', () => {
        class JsonTest {
            @Envapt('TEST_JSON_ARRAY', { converter: Converters.Json, fallback: [] })
            static readonly jsonArray: JsonValue;

            @Envapt('TEST_JSON_INVALID', { converter: Converters.Json, fallback: { error: 'fallback' } })
            static readonly jsonInvalid: JsonValue;
        }

        it('should parse valid JSON arrays', () => {
            expect(JsonTest.jsonArray).to.deep.equal([1, 2, 3, 'four', true]);
        });

        it('should use fallback for invalid JSON', () => {
            expect(JsonTest.jsonInvalid).to.deep.equal({ error: 'fallback' });
        });

        it('returns the JSON value null over the fallback', () => {
            expect(Envapter.getAs('TEST_JSON_NULL', Converters.Json, { error: 'fallback' })).to.equal(null);
        });
    });

    describe('url converter', () => {
        class UrlTest {
            @Envapt('TEST_URL_INVALID', { converter: Converters.Url, fallback: new URL('http://fallback.com') })
            static readonly invalidUrl: URL;
        }

        it('should use fallback for invalid URLs', () => {
            expect(UrlTest.invalidUrl.href).to.equal('http://fallback.com/');
        });
    });

    describe('regexp converter', () => {
        class RegexpTest {
            @Envapt('TEST_REGEXP_SIMPLE', { converter: Converters.RegExp })
            static readonly simpleRegexp: RegExp | undefined;

            @Envapt('TEST_REGEXP_INVALID', { converter: Converters.RegExp, fallback: /fallback/i })
            static readonly invalidRegexp: RegExp;
        }

        it('should parse simple regexp', () => {
            expect(RegexpTest.simpleRegexp?.source).to.equal('\\d+');
            expect(RegexpTest.simpleRegexp?.flags).to.equal('');
        });

        it('should use fallback for invalid regexp', () => {
            expect(RegexpTest.invalidRegexp.source).to.equal('fallback');
            expect(RegexpTest.invalidRegexp.flags).to.equal('i');
        });
    });

    describe('date converter', () => {
        class DateTest {
            @Envapt('TEST_DATE_TIMESTAMP', { converter: Converters.Date })
            static readonly timestampDate: Date | undefined;

            @Envapt('TEST_DATE_INVALID', { converter: Converters.Date, fallback: new Date('2023-01-01') })
            static readonly invalidDate: Date;

            @Envapt('TEST_DATE_NON_ISO_1', { converter: Converters.Date, fallback: new Date('2024-01-01') })
            static readonly nonIsoDate1: Date;

            @Envapt('TEST_DATE_NON_ISO_2', { converter: Converters.Date, fallback: new Date('2024-01-01') })
            static readonly nonIsoDate2: Date;

            @Envapt('TEST_DATE_NO_Z', { converter: Converters.Date, fallback: new Date('2024-01-01') })
            static readonly noZDate: Date;
        }

        it('should parse timestamp dates', () => {
            expect(DateTest.timestampDate).to.be.instanceOf(Date);
            // 1640995200000 is 2022-01-01T00:00:00.000Z
            expect(DateTest.timestampDate?.getUTCFullYear()).to.equal(2022);
        });

        it('should use fallback for invalid dates', () => {
            expect(DateTest.invalidDate.getUTCFullYear()).to.equal(2023);
        });

        it('should reject non-ISO date strings and use fallback', () => {
            // fixture: "December 25, 2023"
            expect(DateTest.nonIsoDate1.getUTCFullYear()).to.equal(2024);

            // fixture: "12/25/2023"
            expect(DateTest.nonIsoDate2.getUTCFullYear()).to.equal(2024);

            // fixture: ISO without the trailing Z
            expect(DateTest.noZDate.getUTCFullYear()).to.equal(2024);
        });
    });

    describe('time converter', () => {
        class TimeTest {
            @Envapt('TEST_TIME_DECIMAL_SECONDS', { converter: Converters.Time, fallback: 0 })
            static readonly timeDecimalSeconds: number;

            @Envapt('TEST_TIME_PLAIN_NUMBER', { converter: Converters.Time, fallback: 0 })
            static readonly timePlainNumber: number;

            @Envapt('TEST_TIME_INVALID', { converter: Converters.Time, fallback: 999 })
            static readonly timeInvalid: number;

            @Envapt('TEST_TIME_INVALID_UNIT', { converter: Converters.Time, fallback: 777 })
            static readonly timeInvalidUnit: number;
        }

        it('should handle decimal seconds', () => {
            expect(TimeTest.timeDecimalSeconds).to.equal(1500); // 1.5s = 1500ms
        });

        it('should treat plain numbers as milliseconds', () => {
            expect(TimeTest.timePlainNumber).to.equal(1000);
        });

        it('should use fallback for invalid time format', () => {
            expect(TimeTest.timeInvalid).to.equal(999);
        });

        it('should use fallback for invalid time unit', () => {
            expect(TimeTest.timeInvalidUnit).to.equal(777);
        });
    });

    describe('boolean converter', () => {
        class BooleanEdgeCaseTest {
            @Envapt('TEST_BOOL_TRUE_UPPER', { converter: Converters.Boolean, fallback: false })
            static readonly boolTrueUpper: boolean;

            @Envapt('TEST_BOOL_YES', { converter: Converters.Boolean, fallback: false })
            static readonly boolYes: boolean;

            @Envapt('TEST_BOOL_ON', { converter: Converters.Boolean, fallback: false })
            static readonly boolOn: boolean;

            @Envapt('TEST_BOOL_ONE', { converter: Converters.Boolean, fallback: false })
            static readonly boolOne: boolean;

            @Envapt('TEST_BOOL_FALSE_UPPER', { converter: Converters.Boolean, fallback: true })
            static readonly boolFalseUpper: boolean;

            @Envapt('TEST_BOOL_NO', { converter: Converters.Boolean, fallback: true })
            static readonly boolNo: boolean;

            @Envapt('TEST_BOOL_OFF', { converter: Converters.Boolean, fallback: true })
            static readonly boolOff: boolean;

            @Envapt('TEST_BOOL_ZERO', { converter: Converters.Boolean, fallback: true })
            static readonly boolZero: boolean;

            @Envapt('TEST_BOOL_UNKNOWN', { converter: Converters.Boolean, fallback: true })
            static readonly boolUnknown: boolean;
        }

        it('reads TRUE, yes, on, and 1 as true', () => {
            expect(BooleanEdgeCaseTest.boolTrueUpper).to.be.true;
            expect(BooleanEdgeCaseTest.boolYes).to.be.true;
            expect(BooleanEdgeCaseTest.boolOn).to.be.true;
            expect(BooleanEdgeCaseTest.boolOne).to.be.true;
        });

        it('reads FALSE, no, off, and 0 as false', () => {
            expect(BooleanEdgeCaseTest.boolFalseUpper).to.be.false;
            expect(BooleanEdgeCaseTest.boolNo).to.be.false;
            expect(BooleanEdgeCaseTest.boolOff).to.be.false;
            expect(BooleanEdgeCaseTest.boolZero).to.be.false;
        });

        it('should use fallback for unknown values', () => {
            expect(BooleanEdgeCaseTest.boolUnknown).to.be.true;
        });
    });
});
