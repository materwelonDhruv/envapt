import { resolve } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { Converters, Envapter } from '../src';
import { Envapt } from '../src/legacy';

describe('template variable resolution', () => {
    beforeEach(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.builtin-test`)));

    class TemplateTest {
        @Envapt('TEST_STRING_TEMPLATE', { converter: Converters.String, fallback: 'default' })
        static readonly stringTemplate: string;

        @Envapt('TEST_NUMBER_TEMPLATE', { converter: Converters.Number, fallback: 0 })
        static readonly numberTemplate: number;

        @Envapt('TEST_ARRAY_COMMA_TEMPLATE', { converter: Converters.array(), fallback: [] })
        static readonly arrayCommaTemplate: string[];

        @Envapt('TEST_REGEXP_TEMPLATE', { converter: Converters.RegExp, fallback: /fallback/ })
        static readonly regexpTemplate: RegExp;
    }

    it('should resolve templates in string converter', () => {
        expect(TemplateTest.stringTemplate).to.equal('hello world');
    });

    it('expands the template before a built-in converter runs', () => {
        expect(TemplateTest.numberTemplate).to.equal(42);
    });

    it('expands the template before an array converter splits it', () => {
        expect(TemplateTest.arrayCommaTemplate).to.deep.equal(['alpha', 'beta', 'gamma']);
    });

    it('expands a template inside regexp braces', () => {
        // \d{${TEMPLATE_NUM_BASE}} becomes \d{42}
        expect(TemplateTest.regexpTemplate.source).to.equal('\\d{42}');
    });
});
