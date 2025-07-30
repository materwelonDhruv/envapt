import { resolve } from 'node:path';

import { expect } from 'chai';

import { Envapt } from '../src/Envapt';
import { Envapter } from '../src/Envapter';

describe('Built-in Converters', () => {
  before(() => (Envapter.envPaths = resolve(__dirname, '.env.builtin-test')));

  describe('basic type converters', () => {
    class BasicTypeTest {
      @Envapt('TEST_STRING', { converter: 'string', fallback: 'default' })
      static readonly testString: string;

      @Envapt('TEST_NUMBER', { converter: 'number', fallback: 0 })
      static readonly testNumber: number;

      @Envapt('TEST_BOOLEAN', { converter: 'boolean', fallback: false })
      static readonly testBoolean: boolean;

      @Envapt('TEST_INTEGER', { converter: 'integer', fallback: 0 })
      static readonly testInteger: number;

      @Envapt('TEST_FLOAT', { converter: 'float', fallback: 0.0 })
      static readonly testFloat: number;

      @Envapt('TEST_BIGINT', { converter: 'bigint', fallback: 0n })
      static readonly testBigint: bigint;

      @Envapt('TEST_SYMBOL', { converter: 'symbol', fallback: Symbol('default') })
      static readonly testSymbol: symbol;
    }

    it('should handle string converter', () => {
      expect(BasicTypeTest.testString).to.equal('hello world');
    });

    it('should handle number converter', () => {
      expect(BasicTypeTest.testNumber).to.equal(42.5);
    });

    it('should handle boolean converter for truthy values', () => {
      expect(BasicTypeTest.testBoolean).to.be.true;
    });

    it('should handle integer converter', () => {
      expect(BasicTypeTest.testInteger).to.equal(42);
    });

    it('should handle float converter', () => {
      expect(BasicTypeTest.testFloat).to.equal(3.14159);
    });

    it('should handle bigint converter', () => {
      expect(BasicTypeTest.testBigint).to.equal(123456789012345678901234567890n);
    });

    it('should handle symbol converter', () => {
      expect(BasicTypeTest.testSymbol).to.be.a('symbol');
      expect(BasicTypeTest.testSymbol.description).to.equal('mysymbol');
    });
  });

  describe('array converters', () => {
    class ArrayTest {
      @Envapt('TEST_ARRAY_COMMA', { converter: 'array', fallback: [] })
      static readonly arrayDefault: string[];

      @Envapt('TEST_ARRAY_COMMA', { converter: { delimiter: ',' }, fallback: [] })
      static readonly arrayComma: string[];

      @Envapt('TEST_ARRAY_SPACE', { converter: { delimiter: ' ' }, fallback: [] })
      static readonly arraySpace: string[];

      @Envapt('TEST_ARRAY_EMPTY', { converter: 'array', fallback: ['default'] })
      static readonly arrayEmpty: string[];

      @Envapt('TEST_ARRAY_WHITESPACE_ONLY', { converter: 'array', fallback: [] })
      static readonly arrayWhitespaceOnly: string[];

      @Envapt('TEST_ARRAY_COMMA_SPACE', { converter: { delimiter: ', ' }, fallback: [] })
      static readonly arrayCommaSpace: string[];

      @Envapt('NONEXISTENT_ARRAY', { converter: 'array', fallback: ['fallback1', 'fallback2'] })
      static readonly nonexistentArray: string[];

      @Envapt('TEST_ARRAY_NUMBERS', { converter: { delimiter: ',', type: 'number' }, fallback: [] })
      static readonly arrayNumbers: number[];

      @Envapt('TEST_ARRAY_BOOLEANS', { converter: { delimiter: ',', type: 'boolean' }, fallback: [] })
      static readonly arrayBooleans: boolean[];

      @Envapt('TEST_ARRAY_TIME', { converter: { delimiter: ',', type: 'time' }, fallback: [] })
      static readonly arrayTime: number[];
    }

    it('should parse arrays with default delimiter (comma)', () => {
      expect(ArrayTest.arrayDefault).to.deep.equal(['item1', 'item2', 'item3']);
    });

    it('should parse comma-separated arrays', () => {
      expect(ArrayTest.arrayComma).to.deep.equal(['item1', 'item2', 'item3']);
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

    it('should convert array elements to numbers', () => {
      expect(ArrayTest.arrayNumbers).to.deep.equal([1, 2, 3]);
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
      @Envapt('TEST_JSON_OBJECT', { converter: 'json', fallback: {} })
      static readonly jsonObject: object;

      @Envapt('TEST_JSON_ARRAY', { converter: 'json', fallback: [] })
      static readonly jsonArray: unknown[];

      @Envapt('TEST_JSON_INVALID', { converter: 'json', fallback: { error: 'fallback' } })
      static readonly jsonInvalid: object;

      @Envapt('NONEXISTENT_JSON', { converter: 'json', fallback: { default: true } })
      static readonly nonexistentJson: object;
    }

    it('should parse valid JSON objects', () => {
      expect(JsonTest.jsonObject).to.deep.equal({ name: 'test', version: 1, enabled: true });
    });

    it('should parse valid JSON arrays', () => {
      expect(JsonTest.jsonArray).to.deep.equal([1, 2, 3, 'four', true]);
    });

    it('should use fallback for invalid JSON', () => {
      expect(JsonTest.jsonInvalid).to.deep.equal({ error: 'fallback' });
    });

    it('should use fallback for nonexistent JSON', () => {
      expect(JsonTest.nonexistentJson).to.deep.equal({ default: true });
    });
  });

  describe('url converter', () => {
    class UrlTest {
      @Envapt('TEST_URL_VALID', { converter: 'url' })
      static readonly validUrl: URL;

      @Envapt('TEST_URL_INVALID', { converter: 'url', fallback: new URL('http://fallback.com') })
      static readonly invalidUrl: URL;

      @Envapt('NONEXISTENT_URL', { converter: 'url', fallback: new URL('http://default.com') })
      static readonly nonexistentUrl: URL;
    }

    it('should parse valid URLs', () => {
      expect(UrlTest.validUrl).to.be.instanceOf(URL);
      expect(UrlTest.validUrl.href).to.equal('https://api.example.com/v1');
    });

    it('should use fallback for invalid URLs', () => {
      expect(UrlTest.invalidUrl).to.be.instanceOf(URL);
      expect(UrlTest.invalidUrl.href).to.equal('http://fallback.com/');
    });

    it('should use fallback for nonexistent URLs', () => {
      expect(UrlTest.nonexistentUrl).to.be.instanceOf(URL);
      expect(UrlTest.nonexistentUrl.href).to.equal('http://default.com/');
    });
  });

  describe('regexp converter', () => {
    class RegexpTest {
      @Envapt('TEST_REGEXP_SIMPLE', { converter: 'regexp' })
      static readonly simpleRegexp: RegExp;

      @Envapt('TEST_REGEXP_WITH_FLAGS', { converter: 'regexp' })
      static readonly regexpWithFlags: RegExp;

      @Envapt('TEST_REGEXP_EMAIL', { converter: 'regexp' })
      static readonly emailRegexp: RegExp;

      @Envapt('TEST_REGEXP_URL_PATTERN', { converter: 'regexp' })
      static readonly urlRegexp: RegExp;

      @Envapt('TEST_REGEXP_PHONE', { converter: 'regexp' })
      static readonly phoneRegexp: RegExp;

      @Envapt('TEST_REGEXP_INVALID', { converter: 'regexp', fallback: /fallback/i })
      static readonly invalidRegexp: RegExp;

      @Envapt('NONEXISTENT_REGEXP', { converter: 'regexp', fallback: /default/ })
      static readonly nonexistentRegexp: RegExp;
    }

    it('should parse simple regexp', () => {
      expect(RegexpTest.simpleRegexp).to.be.instanceOf(RegExp);
      expect(RegexpTest.simpleRegexp.source).to.equal('\\d+');
      expect(RegexpTest.simpleRegexp.flags).to.equal('');

      // Test actual regex functionality
      expect(RegexpTest.simpleRegexp.test('123')).to.be.true;
      expect(RegexpTest.simpleRegexp.test('abc')).to.be.false;
      expect(RegexpTest.simpleRegexp.test('42')).to.be.true;
    });

    it('should parse regexp with flags', () => {
      expect(RegexpTest.regexpWithFlags).to.be.instanceOf(RegExp);
      expect(RegexpTest.regexpWithFlags.source).to.equal('[a-z]+');
      expect(RegexpTest.regexpWithFlags.flags).to.equal('gi');

      // Reset regex state before each test due to global flag
      RegexpTest.regexpWithFlags.lastIndex = 0;
      expect(RegexpTest.regexpWithFlags.test('hello')).to.be.true;

      RegexpTest.regexpWithFlags.lastIndex = 0;
      expect(RegexpTest.regexpWithFlags.test('WORLD')).to.be.true; // case insensitive with 'i' flag

      RegexpTest.regexpWithFlags.lastIndex = 0;
      expect(RegexpTest.regexpWithFlags.test('123')).to.be.false;

      // Test case insensitive behavior specifically
      RegexpTest.regexpWithFlags.lastIndex = 0;
      expect(RegexpTest.regexpWithFlags.test('ABC')).to.be.true; // uppercase letters should match due to 'i' flag

      RegexpTest.regexpWithFlags.lastIndex = 0;
      expect(RegexpTest.regexpWithFlags.test('MixedCase')).to.be.true;
    });

    it('should parse complex email regexp', () => {
      expect(RegexpTest.emailRegexp).to.be.instanceOf(RegExp);
      expect(RegexpTest.emailRegexp.flags).to.equal('i');

      // Test actual email validation functionality
      expect(RegexpTest.emailRegexp.test('user@example.com')).to.be.true;
      expect(RegexpTest.emailRegexp.test('test.email+tag@domain.co.uk')).to.be.true;
      expect(RegexpTest.emailRegexp.test('user123@subdomain.example.org')).to.be.true;
      expect(RegexpTest.emailRegexp.test('invalid.email')).to.be.false;
      expect(RegexpTest.emailRegexp.test('@domain.com')).to.be.false;
      expect(RegexpTest.emailRegexp.test('user@')).to.be.false;
    });

    it('should parse complex URL regexp', () => {
      expect(RegexpTest.urlRegexp).to.be.instanceOf(RegExp);

      // Test actual URL validation functionality
      expect(RegexpTest.urlRegexp.test('https://www.example.com')).to.be.true;
      expect(RegexpTest.urlRegexp.test('http://api.test.co')).to.be.true;
      expect(RegexpTest.urlRegexp.test('https://subdomain.example.org/path/to/resource')).to.be.true;
      expect(RegexpTest.urlRegexp.test('ftp://example.com')).to.be.false;
      expect(RegexpTest.urlRegexp.test('not-a-url')).to.be.false;
      expect(RegexpTest.urlRegexp.test('http://')).to.be.false;
    });

    it('should parse complex phone regexp', () => {
      expect(RegexpTest.phoneRegexp).to.be.instanceOf(RegExp);

      // Test actual phone number validation functionality
      expect(RegexpTest.phoneRegexp.test('(555) 123-4567')).to.be.true;
      expect(RegexpTest.phoneRegexp.test('555-123-4567')).to.be.true;
      expect(RegexpTest.phoneRegexp.test('555.123.4567')).to.be.true;
      expect(RegexpTest.phoneRegexp.test('+1 555 123 4567')).to.be.true;
      expect(RegexpTest.phoneRegexp.test('5551234567')).to.be.true;
      expect(RegexpTest.phoneRegexp.test('123-45-6789')).to.be.false; // wrong format
      expect(RegexpTest.phoneRegexp.test('555-12-34567')).to.be.false; // wrong grouping
    });

    it('should use fallback for invalid regexp', () => {
      expect(RegexpTest.invalidRegexp).to.be.instanceOf(RegExp);
      expect(RegexpTest.invalidRegexp.source).to.equal('fallback');
      expect(RegexpTest.invalidRegexp.flags).to.equal('i');

      // Test fallback regex functionality
      expect(RegexpTest.invalidRegexp.test('fallback')).to.be.true;
      expect(RegexpTest.invalidRegexp.test('FALLBACK')).to.be.true; // case insensitive
      expect(RegexpTest.invalidRegexp.test('other')).to.be.false;
    });

    it('should use fallback for nonexistent regexp', () => {
      expect(RegexpTest.nonexistentRegexp).to.be.instanceOf(RegExp);
      expect(RegexpTest.nonexistentRegexp.source).to.equal('default');

      // Test fallback regex functionality
      expect(RegexpTest.nonexistentRegexp.test('default')).to.be.true;
      expect(RegexpTest.nonexistentRegexp.test('other')).to.be.false;
    });
  });

  describe('date converter', () => {
    class DateTest {
      @Envapt('TEST_DATE_ISO', { converter: 'date' })
      static readonly isoDate: Date;

      @Envapt('TEST_DATE_TIMESTAMP', { converter: 'date' })
      static readonly timestampDate: Date;

      @Envapt('TEST_DATE_INVALID', { converter: 'date', fallback: new Date('2023-01-01') })
      static readonly invalidDate: Date;

      @Envapt('NONEXISTENT_DATE', { converter: 'date', fallback: new Date('2024-01-01') })
      static readonly nonexistentDate: Date;
    }

    it('should parse ISO date strings', () => {
      expect(DateTest.isoDate).to.be.instanceOf(Date);
      expect(DateTest.isoDate.getFullYear()).to.equal(2023);
      expect(DateTest.isoDate.getMonth()).to.equal(11); // December (0-indexed)
      expect(DateTest.isoDate.getDate()).to.equal(25);
    });

    it('should parse timestamp dates', () => {
      expect(DateTest.timestampDate).to.be.instanceOf(Date);
      // 1640995200000 is 2022-01-01T00:00:00.000Z
      expect(DateTest.timestampDate.getFullYear()).to.equal(2022);
    });

    it('should use fallback for invalid dates', () => {
      expect(DateTest.invalidDate).to.be.instanceOf(Date);
      expect(DateTest.invalidDate.getFullYear()).to.equal(2023);
    });

    it('should use fallback for nonexistent dates', () => {
      expect(DateTest.nonexistentDate).to.be.instanceOf(Date);
      expect(DateTest.nonexistentDate.getFullYear()).to.equal(2024);
    });
  });

  describe('time converter', () => {
    class TimeTest {
      @Envapt('TEST_TIME_MILLISECONDS', { converter: 'time', fallback: 0 })
      static readonly timeMs: number;

      @Envapt('TEST_TIME_SECONDS', { converter: 'time', fallback: 0 })
      static readonly timeSeconds: number;

      @Envapt('TEST_TIME_MINUTES', { converter: 'time', fallback: 0 })
      static readonly timeMinutes: number;

      @Envapt('TEST_TIME_HOURS', { converter: 'time', fallback: 0 })
      static readonly timeHours: number;

      @Envapt('TEST_TIME_DECIMAL_SECONDS', { converter: 'time', fallback: 0 })
      static readonly timeDecimalSeconds: number;

      @Envapt('TEST_TIME_PLAIN_NUMBER', { converter: 'time', fallback: 0 })
      static readonly timePlainNumber: number;

      @Envapt('TEST_TIME_INVALID', { converter: 'time', fallback: 999 })
      static readonly timeInvalid: number;

      @Envapt('NONEXISTENT_TIME', { converter: 'time', fallback: 5000 })
      static readonly nonexistentTime: number;
    }

    it('should convert milliseconds correctly', () => {
      expect(TimeTest.timeMs).to.equal(500);
    });

    it('should convert seconds to milliseconds', () => {
      expect(TimeTest.timeSeconds).to.equal(5000); // 5s = 5000ms
    });

    it('should convert minutes to milliseconds', () => {
      expect(TimeTest.timeMinutes).to.equal(1800000); // 30m = 1800000ms
    });

    it('should convert hours to milliseconds', () => {
      expect(TimeTest.timeHours).to.equal(7200000); // 2h = 7200000ms
    });

    it('should handle decimal seconds', () => {
      expect(TimeTest.timeDecimalSeconds).to.equal(1500); // 1.5s = 1500ms
    });

    it('should treat plain numbers as milliseconds', () => {
      expect(TimeTest.timePlainNumber).to.equal(1000); // 1000 = 1000ms
    });

    it('should use fallback for invalid time format', () => {
      expect(TimeTest.timeInvalid).to.equal(999);
    });

    it('should use fallback for nonexistent time', () => {
      expect(TimeTest.nonexistentTime).to.equal(5000);
    });
  });

  describe('boolean converter edge cases', () => {
    class BooleanEdgeCaseTest {
      @Envapt('TEST_BOOL_TRUE_UPPER', { converter: 'boolean', fallback: false })
      static readonly boolTrueUpper: boolean;

      @Envapt('TEST_BOOL_YES', { converter: 'boolean', fallback: false })
      static readonly boolYes: boolean;

      @Envapt('TEST_BOOL_ON', { converter: 'boolean', fallback: false })
      static readonly boolOn: boolean;

      @Envapt('TEST_BOOL_ONE', { converter: 'boolean', fallback: false })
      static readonly boolOne: boolean;

      @Envapt('TEST_BOOL_FALSE_UPPER', { converter: 'boolean', fallback: true })
      static readonly boolFalseUpper: boolean;

      @Envapt('TEST_BOOL_NO', { converter: 'boolean', fallback: true })
      static readonly boolNo: boolean;

      @Envapt('TEST_BOOL_OFF', { converter: 'boolean', fallback: true })
      static readonly boolOff: boolean;

      @Envapt('TEST_BOOL_ZERO', { converter: 'boolean', fallback: true })
      static readonly boolZero: boolean;

      @Envapt('TEST_BOOL_EMPTY', { converter: 'boolean', fallback: true })
      static readonly boolEmpty: boolean;

      @Envapt('TEST_BOOL_UNKNOWN', { converter: 'boolean', fallback: true })
      static readonly boolUnknown: boolean;
    }

    it('should handle TRUE (uppercase)', () => {
      expect(BooleanEdgeCaseTest.boolTrueUpper).to.be.true;
    });

    it('should handle yes', () => {
      expect(BooleanEdgeCaseTest.boolYes).to.be.true;
    });

    it('should handle on', () => {
      expect(BooleanEdgeCaseTest.boolOn).to.be.true;
    });

    it('should handle 1', () => {
      expect(BooleanEdgeCaseTest.boolOne).to.be.true;
    });

    it('should handle FALSE (uppercase)', () => {
      expect(BooleanEdgeCaseTest.boolFalseUpper).to.be.false;
    });

    it('should handle no', () => {
      expect(BooleanEdgeCaseTest.boolNo).to.be.false;
    });

    it('should handle off', () => {
      expect(BooleanEdgeCaseTest.boolOff).to.be.false;
    });

    it('should handle 0', () => {
      expect(BooleanEdgeCaseTest.boolZero).to.be.false;
    });

    it('should use fallback for empty strings', () => {
      expect(BooleanEdgeCaseTest.boolEmpty).to.be.true;
    });

    it('should use fallback for unknown values', () => {
      expect(BooleanEdgeCaseTest.boolUnknown).to.be.true;
    });
  });

  describe('template variable resolution', () => {
    class TemplateTest {
      // String converter with templates
      @Envapt('TEST_STRING_TEMPLATE', { converter: 'string', fallback: 'default' })
      static readonly stringTemplate: string;

      // Number converters with templates
      @Envapt('TEST_NUMBER_TEMPLATE', { converter: 'number', fallback: 0 })
      static readonly numberTemplate: number;

      @Envapt('TEST_INTEGER_TEMPLATE', { converter: 'integer', fallback: 0 })
      static readonly integerTemplate: number;

      @Envapt('TEST_FLOAT_TEMPLATE', { converter: 'float', fallback: 0.0 })
      static readonly floatTemplate: number;

      // Boolean converters with templates
      @Envapt('TEST_BOOLEAN_TEMPLATE', { converter: 'boolean', fallback: false })
      static readonly booleanTemplate: boolean;

      @Envapt('TEST_BOOLEAN_FALSE_TEMPLATE', { converter: 'boolean', fallback: true })
      static readonly booleanFalseTemplate: boolean;

      // BigInt and Symbol converters with templates
      @Envapt('TEST_BIGINT_TEMPLATE', { converter: 'bigint', fallback: 0n })
      static readonly bigintTemplate: bigint;

      @Envapt('TEST_SYMBOL_TEMPLATE', { converter: 'symbol', fallback: Symbol('default') })
      static readonly symbolTemplate: symbol;

      // Array converters with templates
      @Envapt('TEST_ARRAY_COMMA_TEMPLATE', { converter: 'array', fallback: [] })
      static readonly arrayCommaTemplate: string[];

      @Envapt('TEST_ARRAY_SPACE_TEMPLATE', { converter: { delimiter: ' ' }, fallback: [] })
      static readonly arraySpaceTemplate: string[];

      @Envapt('TEST_ARRAY_COMMA_SPACE_TEMPLATE', { converter: { delimiter: ', ' }, fallback: [] })
      static readonly arrayCommaSpaceTemplate: string[];

      // JSON converter with templates
      @Envapt('TEST_JSON_OBJECT_TEMPLATE', { converter: 'json', fallback: {} })
      static readonly jsonObjectTemplate: object;

      // URL converter with templates
      @Envapt('TEST_URL_TEMPLATE', { converter: 'url', fallback: new URL('http://fallback.com') })
      static readonly urlTemplate: URL;

      // RegExp converter with templates
      @Envapt('TEST_REGEXP_TEMPLATE', { converter: 'regexp', fallback: /fallback/ })
      static readonly regexpTemplate: RegExp;

      @Envapt('TEST_REGEXP_EMAIL_TEMPLATE', { converter: 'regexp', fallback: /fallback/ })
      static readonly regexpEmailTemplate: RegExp;

      @Envapt('TEST_REGEXP_PHONE_TEMPLATE', { converter: 'regexp', fallback: /fallback/ })
      static readonly regexpPhoneTemplate: RegExp;

      // Date converter with templates
      @Envapt('TEST_DATE_TEMPLATE', { converter: 'date', fallback: new Date('2020-01-01') })
      static readonly dateTemplate: Date;

      // Time converter with templates
      @Envapt('TEST_TIME_TEMPLATE', { converter: 'time', fallback: 0 })
      static readonly timeTemplate: number;
    }

    it('should resolve templates in string converter', () => {
      expect(TemplateTest.stringTemplate).to.equal('hello world');
    });

    it('should resolve templates in number converter', () => {
      expect(TemplateTest.numberTemplate).to.equal(42);
    });

    it('should resolve templates in integer converter', () => {
      expect(TemplateTest.integerTemplate).to.equal(42);
    });

    it('should resolve templates in float converter', () => {
      expect(TemplateTest.floatTemplate).to.equal(3.14);
    });

    it('should resolve templates in boolean converter - true', () => {
      expect(TemplateTest.booleanTemplate).to.be.true;
    });

    it('should resolve templates in boolean converter - false', () => {
      expect(TemplateTest.booleanFalseTemplate).to.be.false;
    });

    it('should resolve templates in bigint converter', () => {
      expect(TemplateTest.bigintTemplate).to.equal(42n);
    });

    it('should resolve templates in symbol converter', () => {
      expect(TemplateTest.symbolTemplate).to.be.a('symbol');
      expect(TemplateTest.symbolTemplate.description).to.equal('hello');
    });

    it('should resolve templates in comma array converter', () => {
      expect(TemplateTest.arrayCommaTemplate).to.deep.equal(['alpha', 'beta', 'gamma']);
    });

    it('should resolve templates in space array converter', () => {
      expect(TemplateTest.arraySpaceTemplate).to.deep.equal(['alpha', 'beta', 'gamma']);
    });

    it('should resolve templates in comma-space array converter', () => {
      expect(TemplateTest.arrayCommaSpaceTemplate).to.deep.equal(['alpha', 'beta', 'gamma']);
    });

    it('should resolve templates in JSON converter', () => {
      expect(TemplateTest.jsonObjectTemplate).to.deep.equal({
        host: 'localhost',
        port: 5432,
        enabled: true
      });
    });

    it('should resolve templates in URL converter', () => {
      expect(TemplateTest.urlTemplate).to.be.instanceOf(URL);
      expect(TemplateTest.urlTemplate.href).to.equal('https://localhost:5432/api');
    });

    it('should resolve templates in RegExp converter', () => {
      expect(TemplateTest.regexpTemplate).to.be.instanceOf(RegExp);

      // The template should resolve from \d{${TEMPLATE_NUM_BASE}} to \d{42}
      expect(TemplateTest.regexpTemplate.source).to.equal('\\d{42}');

      // The pattern \d{42} should match any 42 consecutive digits anywhere in the string
      expect(TemplateTest.regexpTemplate.test('123456789012345678901234567890123456789012')).to.be.true;
      expect(TemplateTest.regexpTemplate.test('abc123456789012345678901234567890123456789012def')).to.be.true; // 42 digits in middle
      expect(TemplateTest.regexpTemplate.test('12345678901234567890123456789012345678901')).to.be.false; // only 41 digits
      expect(TemplateTest.regexpTemplate.test('abc')).to.be.false; // not digits
    });

    it('should resolve templates in complex email RegExp converter', () => {
      expect(TemplateTest.regexpEmailTemplate).to.be.instanceOf(RegExp);

      // Should resolve template variables correctly
      expect(TemplateTest.regexpEmailTemplate.source).to.equal('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.example\\.com$');
      expect(TemplateTest.regexpEmailTemplate.flags).to.equal('i');

      // Test basic email validation with template-resolved domain (example.com)
      expect(TemplateTest.regexpEmailTemplate.test('user@test.example.com')).to.be.true;

      expect(TemplateTest.regexpEmailTemplate.test('user@api.example.com')).to.be.true;

      expect(TemplateTest.regexpEmailTemplate.test('USER@TEST.EXAMPLE.COM')).to.be.true; // case insensitive

      // Test that it rejects different domains
      expect(TemplateTest.regexpEmailTemplate.test('user@otherdomain.com')).to.be.false;
      expect(TemplateTest.regexpEmailTemplate.test('invalid.email')).to.be.false;
    });

    it('should resolve templates in complex phone RegExp converter', () => {
      expect(TemplateTest.regexpPhoneTemplate).to.be.instanceOf(RegExp);

      // Should resolve template variables correctly
      expect(TemplateTest.regexpPhoneTemplate.source).to.equal(
        '^\\+?1?[-.\\s]?\\(?([0-9]{3})\\)?[-.\\s]?([0-9]{3})[-.\\s]?([0-9]{4})$'
      );
      expect(TemplateTest.regexpPhoneTemplate.flags).to.equal('');

      // Test basic phone number validation with template-resolved format
      expect(TemplateTest.regexpPhoneTemplate.test('555-123-4567')).to.be.true;
      expect(TemplateTest.regexpPhoneTemplate.test('123-456-7890')).to.be.true;
      expect(TemplateTest.regexpPhoneTemplate.test('(555) 123-4567')).to.be.true;
      expect(TemplateTest.regexpPhoneTemplate.test('5551234567')).to.be.true;

      // Test invalid phone numbers
      expect(TemplateTest.regexpPhoneTemplate.test('not-a-phone')).to.be.false; // not a phone number
    });

    it('should resolve templates in Date converter', () => {
      expect(TemplateTest.dateTemplate).to.be.instanceOf(Date);
      expect(TemplateTest.dateTemplate.getFullYear()).to.equal(2023);
      expect(TemplateTest.dateTemplate.getMonth()).to.equal(11); // December (0-indexed)
      expect(TemplateTest.dateTemplate.getDate()).to.equal(25);
    });

    it('should resolve templates in Time converter', () => {
      expect(TemplateTest.timeTemplate).to.equal(10000); // 10s = 10000ms
    });
  });
});
