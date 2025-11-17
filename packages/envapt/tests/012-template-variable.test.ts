import { resolve } from 'node:path';

import { expect } from 'chai';
import { it, describe, beforeEach } from 'vitest';

import { Converters, Envapt, Envapter } from '../src';

describe('template variable resolution', () => {
    beforeEach(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.builtin-test`)));

    class TemplateTest {
        // String converter with templates
        @Envapt('TEST_STRING_TEMPLATE', { converter: Converters.String, fallback: 'default' })
        static readonly stringTemplate: string;

        // Number converters with templates
        @Envapt('TEST_NUMBER_TEMPLATE', { converter: Converters.Number, fallback: 0 })
        static readonly numberTemplate: number;

        @Envapt('TEST_INTEGER_TEMPLATE', { converter: Converters.Integer, fallback: 0 })
        static readonly integerTemplate: number;

        @Envapt('TEST_FLOAT_TEMPLATE', { converter: Converters.Float, fallback: 0.0 })
        static readonly floatTemplate: number;

        // Boolean converters with templates
        @Envapt('TEST_BOOLEAN_TEMPLATE', { converter: Converters.Boolean, fallback: false })
        static readonly booleanTemplate: boolean;

        @Envapt('TEST_BOOLEAN_FALSE_TEMPLATE', { converter: Converters.Boolean, fallback: true })
        static readonly booleanFalseTemplate: boolean;

        // BigInt and Symbol converters with templates
        @Envapt('TEST_BIGINT_TEMPLATE', { converter: Converters.Bigint, fallback: 0n })
        static readonly bigintTemplate: bigint;

        @Envapt('TEST_SYMBOL_TEMPLATE', { converter: Converters.Symbol, fallback: Symbol('default') })
        static readonly symbolTemplate: symbol;

        // Array converters with templates
        @Envapt('TEST_ARRAY_COMMA_TEMPLATE', { converter: Converters.Array, fallback: [] })
        static readonly arrayCommaTemplate: string[];

        @Envapt('TEST_ARRAY_SPACE_TEMPLATE', { converter: { delimiter: ' ' }, fallback: [] })
        static readonly arraySpaceTemplate: string[];

        @Envapt('TEST_ARRAY_COMMA_SPACE_TEMPLATE', { converter: { delimiter: ', ' }, fallback: [] })
        static readonly arrayCommaSpaceTemplate: string[];

        // JSON converter with templates
        @Envapt('TEST_JSON_OBJECT_TEMPLATE', { converter: Converters.Json, fallback: {} })
        static readonly jsonObjectTemplate: object;

        // URL converter with templates
        @Envapt('TEST_URL_TEMPLATE', { converter: Converters.Url, fallback: new URL('http://fallback.com') })
        static readonly urlTemplate: URL;

        // RegExp converter with templates
        @Envapt('TEST_REGEXP_TEMPLATE', { converter: Converters.Regexp, fallback: /fallback/ })
        static readonly regexpTemplate: RegExp;

        @Envapt('TEST_REGEXP_EMAIL_TEMPLATE', { converter: Converters.Regexp, fallback: /fallback/ })
        static readonly regexpEmailTemplate: RegExp;

        @Envapt('TEST_REGEXP_PHONE_TEMPLATE', { converter: Converters.Regexp, fallback: /fallback/ })
        static readonly regexpPhoneTemplate: RegExp;

        // Date converter with templates
        @Envapt('TEST_DATE_TEMPLATE', { converter: Converters.Date, fallback: new Date('2020-01-01') })
        static readonly dateTemplate: Date;

        // Time converter with templates
        @Envapt('TEST_TIME_TEMPLATE', { converter: Converters.Time, fallback: 0 })
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
        const expectedEmailRegexPattern = String.raw`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.example\.com$`;
        expect(TemplateTest.regexpEmailTemplate).to.be.instanceOf(RegExp);

        // Should resolve template variables correctly
        expect(TemplateTest.regexpEmailTemplate.source).to.equal(expectedEmailRegexPattern);
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
        const expectedPhoneRegexPattern = String.raw`^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$`;

        expect(TemplateTest.regexpPhoneTemplate).to.be.instanceOf(RegExp);

        // Should resolve template variables correctly
        expect(TemplateTest.regexpPhoneTemplate.source).to.equal(expectedPhoneRegexPattern);
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
        expect(TemplateTest.dateTemplate.getUTCFullYear()).to.equal(2023);
        expect(TemplateTest.dateTemplate.getUTCMonth()).to.equal(11); // December (0-indexed)
        expect(TemplateTest.dateTemplate.getUTCDate()).to.equal(25);
    });

    it('should resolve templates in Time converter', () => {
        expect(TemplateTest.timeTemplate).to.equal(10000); // 10s = 10000ms
    });
});
