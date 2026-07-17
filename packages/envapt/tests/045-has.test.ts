import { resolve } from 'node:path';

import { afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/infra/Error';

describe('has (v8.1)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.045-has');
    });

    afterEach(() => {
        Envapter.strict = false;
    });

    it('returns true for a present value and false for an absent key', () => {
        expect(Envapter.has('SET_VALUE')).to.equal(true);
        expect(Envapter.has('NEVER_SET_KEY')).to.equal(false);
        expectTypeOf(Envapter.has('SET_VALUE')).toEqualTypeOf<boolean>();
    });

    it('returns false for an empty value always, and for whitespace-only only in strict', () => {
        expect(Envapter.has('EMPTY_VALUE')).to.equal(false);

        expect(Envapter.has('WHITESPACE_ONLY')).to.equal(true);
        Envapter.strict = true;
        expect(Envapter.has('WHITESPACE_ONLY')).to.equal(false);
        expect(Envapter.has(['WHITESPACE_ONLY', 'SET_VALUE'])).to.equal(true);
    });

    it('mirrors getRequired, true exactly when a required read finds a value', () => {
        expect(Envapter.has('SET_VALUE')).to.equal(true);
        expect(() => Envapter.getRequired('SET_VALUE', String)).to.not.throw();

        expect(Envapter.has('EMPTY_VALUE')).to.equal(false);
        expect(() => Envapter.getRequired('EMPTY_VALUE', String)).to.throw(EnvaptError);
    });

    it('resolves templates before answering', () => {
        expect(Envapter.has('TEMPLATE_OK')).to.equal(true);

        // non-strict preserves the unresolved literal as a real value
        expect(Envapter.has('TEMPLATE_MISSING')).to.equal(true);
        expect(Envapter.has(['TEMPLATE_MISSING', 'NEVER_SET_KEY'])).to.equal(true);
    });

    it('returns false under strict for a template that cannot resolve', () => {
        Envapter.strict = true;
        expect(Envapter.has('TEMPLATE_MISSING')).to.equal(false);
    });

    it('mirrors getRequired when a strict template throw precedes a present candidate', () => {
        Envapter.strict = true;
        expect(() => Envapter.getRequired(['TEMPLATE_MISSING', 'SET_VALUE'], String))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        expect(Envapter.has(['TEMPLATE_MISSING', 'SET_VALUE'])).to.equal(false);

        expect(() => Envapter.getRequired(['NEVER_SET_KEY', 'TEMPLATE_MISSING', 'SET_VALUE'], String))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        expect(Envapter.has(['NEVER_SET_KEY', 'TEMPLATE_MISSING', 'SET_VALUE'])).to.equal(false);

        expect(Envapter.getRequired(['SET_VALUE', 'TEMPLATE_MISSING'], String)).to.equal('hello');
        expect(Envapter.has(['SET_VALUE', 'TEMPLATE_MISSING'])).to.equal(true);
    });

    it('treats a reference to an empty variable as a preserved literal, like getRequired', () => {
        expect(Envapter.has('TEMPLATE_EMPTY')).to.equal(true);
        expect(Envapter.getRequired('TEMPLATE_EMPTY', String)).to.equal('${EMPTY_VALUE}');

        Envapter.strict = true;
        expect(Envapter.has('TEMPLATE_EMPTY')).to.equal(false);
        expect(() => Envapter.getRequired('TEMPLATE_EMPTY', String)).to.throw(EnvaptError);
    });

    it('falls through an ordered key list like getRequired', () => {
        expect(Envapter.has(['NEVER_SET_KEY', 'SET_VALUE'])).to.equal(true);
        expect(Envapter.has(['EMPTY_VALUE', 'SET_VALUE'])).to.equal(true);
        expect(Envapter.has(['NEVER_SET_KEY', 'ALSO_NEVER_SET'])).to.equal(false);
    });

    it('reads through an instance', () => {
        const env = new Envapter();
        expect(env.has('SET_VALUE')).to.equal(true);
        expect(env.has('NEVER_SET_KEY')).to.equal(false);
    });

    it('still throws InvalidKeyInput for caller bugs', () => {
        // @ts-expect-error Runtime guard ensures empty arrays are rejected
        expect(() => Envapter.has([]))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidKeyInput);
        expect(() => Envapter.has(''))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidKeyInput);
        expect(() => Envapter.has(['']))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidKeyInput);
        expect(() => Envapter.has(['', 'SET_VALUE']))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidKeyInput);
    });
});
