import { resolve } from 'node:path';

import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/infra/Error';

describe('Semantic converters (v8): port and email', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.039-semantic-converters');
    });

    describe('port', () => {
        it('reads a valid port as a number', () => {
            expect(Envapter.getAs('PORT_VALID', Converters.Port, 0)).to.equal(8080);
            expectTypeOf(Envapter.getAs('PORT_VALID', Converters.Port, 0)).toEqualTypeOf<number>();
        });

        it('accepts 0, the ephemeral-bind wildcard', () => {
            expect(Envapter.getAs('PORT_ZERO', Converters.Port, 8080)).to.equal(0);
        });

        it('accepts the max port 65535', () => {
            expect(Envapter.getAs('PORT_MAX', Converters.Port, 8080)).to.equal(65535);
        });

        it('falls back above 65535', () => {
            expect(Envapter.getAs('PORT_HIGH', Converters.Port, 8080)).to.equal(8080);
        });

        it('falls back below 0', () => {
            expect(Envapter.getAs('PORT_NEG', Converters.Port, 8080)).to.equal(8080);
        });

        it('falls back on a non-integer', () => {
            expect(Envapter.getAs('PORT_FLOAT', Converters.Port, 8080)).to.equal(8080);
        });

        it('falls back on trailing junk', () => {
            expect(Envapter.getAs('PORT_JUNK', Converters.Port, 8080)).to.equal(8080);
        });

        it('falls back on a whitespace-only value', () => {
            expect(Envapter.getAs('PORT_WS', Converters.Port, 8080)).to.equal(8080);
        });

        it('rejects an out-of-range port fallback', () => {
            expect(() => Envapter.getAs('PORT_VALID', Converters.Port, 65536))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('rejects a negative port fallback', () => {
            expect(() => Envapter.getAs('PORT_VALID', Converters.Port, -1))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('throws on a non-number fallback', () => {
            // cast past the type to reach the runtime check
            expect(() => Envapter.getAs('PORT_VALID', Converters.Port, 'nope' as unknown as number))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });
    });

    describe('email', () => {
        it('reads a valid email and returns it unchanged', () => {
            expect(Envapter.getAs('EMAIL_VALID', Converters.Email, 'x@y.z')).to.equal('a@b.com');
            expectTypeOf(Envapter.getAs('EMAIL_VALID', Converters.Email, 'x@y.z')).toEqualTypeOf<string>();
        });

        it('accepts a dotted local part and a multi-label domain', () => {
            expect(Envapter.getAs('EMAIL_DOTTED', Converters.Email, 'x@y.z')).to.equal('first.last@sub.domain.co');
        });

        it('accepts a plus-tagged local part', () => {
            expect(Envapter.getAs('EMAIL_PLUS', Converters.Email, 'x@y.z')).to.equal('user+tag@example.io');
        });

        it('accepts a single-label domain, which WHATWG allows', () => {
            expect(Envapter.getAs('EMAIL_LOCALHOST', Converters.Email, 'x@y.z')).to.equal('x@localhost');
        });

        it('returns the address as-is without lowercasing', () => {
            expect(Envapter.getAs('EMAIL_CAPS', Converters.Email, 'x@y.z')).to.equal('A@B.COM');
        });

        it('falls back when there is no @', () => {
            expect(Envapter.getAs('EMAIL_NOAT', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a missing local part', () => {
            expect(Envapter.getAs('EMAIL_NOLOCAL', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a space in the local part', () => {
            expect(Envapter.getAs('EMAIL_SPACE', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a double @', () => {
            expect(Envapter.getAs('EMAIL_DOUBLEAT', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a missing domain', () => {
            expect(Envapter.getAs('EMAIL_TRAILING', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a space in the domain', () => {
            expect(Envapter.getAs('EMAIL_DOMAINSPACE', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('rejects a non-email fallback', () => {
            expect(() => Envapter.getAs('EMAIL_VALID', Converters.Email, 'not-an-email'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('rejects an empty-string fallback', () => {
            expect(() => Envapter.getAs('EMAIL_VALID', Converters.Email, ''))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('throws on a non-string fallback', () => {
            // cast past the type to reach the runtime check
            expect(() => Envapter.getAs('EMAIL_VALID', Converters.Email, 42 as unknown as string))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });
    });
});
