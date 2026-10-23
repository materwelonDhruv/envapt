import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter, EnvaptError } from '../src';

const taggedTemplatePath = resolve(`${import.meta.dirname}/.env.tagged-template-test`);

describe('Tagged Template Resolver', () => {
    beforeAll(() => (Envapter.envPaths = taggedTemplatePath));

    it('should handle multiple environment variables', () => {
        const info = Envapter.resolve`${'USERNAME'} works at ${'COMPANY'} in ${'CITY'}.`;
        expect(info).to.equal('john works at TechCorp in New York.');
    });

    it('should handle missing environment variables with empty string fallback', () => {
        const message = Envapter.resolve`Hello ${'NONEXISTENT'}, welcome!`;
        expect(message).to.equal('Hello , welcome!');
    });

    it('should handle template strings with no variables', () => {
        const message = Envapter.resolve`This is a simple string.`;
        expect(message).to.equal('This is a simple string.');
    });

    it('should work with single variable', () => {
        const message = Envapter.resolve`${'USERNAME'}`;
        expect(message).to.equal('john');
    });

    it('reads the first present key of an ordered key list in a slot', () => {
        const message = Envapter.resolve`Hello ${['NONEXISTENT', 'USERNAME']}`;
        expect(message).to.equal('Hello john');
    });

    it('should handle consecutive variables', () => {
        const message = Envapter.resolve`${'USERNAME'}${'AGE'}`;
        expect(message).to.equal('john25');
    });

    it('throws when a slot key is an empty string', () => {
        expect(() => Envapter.resolve`hello ${''}`).to.throw(EnvaptError, 'Environment keys cannot be empty strings.');
    });
});
