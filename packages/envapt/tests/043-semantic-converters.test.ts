import { resolve } from 'node:path';

import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/infra/Error';

describe('Semantic converters (v8): port and email', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.043-semantic-converters');
    });

    describe('port', () => {
        it('reads a valid port as a number', () => {
            expect(Envapter.getUsing('PORT_VALID', Converters.Port, 0)).to.equal(8080);
            expectTypeOf(Envapter.getUsing('PORT_VALID', Converters.Port, 0)).toEqualTypeOf<number>();
        });

        it('accepts 0, the ephemeral-bind wildcard', () => {
            expect(Envapter.getUsing('PORT_ZERO', Converters.Port, 8080)).to.equal(0);
        });

        it('accepts the max port 65535', () => {
            expect(Envapter.getUsing('PORT_MAX', Converters.Port, 8080)).to.equal(65535);
        });

        it('falls back above 65535', () => {
            expect(Envapter.getUsing('PORT_HIGH', Converters.Port, 8080)).to.equal(8080);
        });

        it('falls back below 0', () => {
            expect(Envapter.getUsing('PORT_NEG', Converters.Port, 8080)).to.equal(8080);
        });

        it('falls back on a non-integer', () => {
            expect(Envapter.getUsing('PORT_FLOAT', Converters.Port, 8080)).to.equal(8080);
        });

        it('falls back on trailing junk', () => {
            expect(Envapter.getUsing('PORT_JUNK', Converters.Port, 8080)).to.equal(8080);
        });

        it('reads an array of ports', () => {
            expect(Envapter.getUsing('PORTS', Converters.array({ of: Converters.Port }), [])).to.deep.equal([
                3000, 3001, 3002
            ]);
        });

        it('getRequired returns a valid port', () => {
            expect(Envapter.getRequired('PORT_VALID', Converters.Port)).to.equal(8080);
        });

        it('getRequired throws on an out-of-range port', () => {
            expect(() => Envapter.getRequired('PORT_HIGH', Converters.Port))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('rejects an out-of-range port fallback', () => {
            expect(() => Envapter.getUsing('PORT_VALID', Converters.Port, 65536))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('rejects a negative port fallback', () => {
            expect(() => Envapter.getUsing('PORT_VALID', Converters.Port, -1))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('throws on a non-number fallback', () => {
            // cast bypasses the compile-time guard so the runtime port type-checker reject path runs
            expect(() => Envapter.getUsing('PORT_VALID', Converters.Port, 'nope' as unknown as number))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });
    });

    describe('email', () => {
        it('reads a valid email and returns it unchanged', () => {
            expect(Envapter.getUsing('EMAIL_VALID', Converters.Email, 'x@y.z')).to.equal('a@b.com');
            expectTypeOf(Envapter.getUsing('EMAIL_VALID', Converters.Email, 'x@y.z')).toEqualTypeOf<string>();
        });

        it('accepts a dotted local part and a multi-label domain', () => {
            expect(Envapter.getUsing('EMAIL_DOTTED', Converters.Email, 'x@y.z')).to.equal('first.last@sub.domain.co');
        });

        it('accepts a plus-tagged local part', () => {
            expect(Envapter.getUsing('EMAIL_PLUS', Converters.Email, 'x@y.z')).to.equal('user+tag@example.io');
        });

        it('accepts a single-label domain, which WHATWG allows', () => {
            expect(Envapter.getUsing('EMAIL_LOCALHOST', Converters.Email, 'x@y.z')).to.equal('x@localhost');
        });

        it('returns the address as-is without lowercasing', () => {
            expect(Envapter.getUsing('EMAIL_CAPS', Converters.Email, 'x@y.z')).to.equal('A@B.COM');
        });

        it('falls back when there is no @', () => {
            expect(Envapter.getUsing('EMAIL_NOAT', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a missing local part', () => {
            expect(Envapter.getUsing('EMAIL_NOLOCAL', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a space in the local part', () => {
            expect(Envapter.getUsing('EMAIL_SPACE', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a double @', () => {
            expect(Envapter.getUsing('EMAIL_DOUBLEAT', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a missing domain', () => {
            expect(Envapter.getUsing('EMAIL_TRAILING', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('falls back on a space in the domain', () => {
            expect(Envapter.getUsing('EMAIL_DOMAINSPACE', Converters.Email, 'f@b.co')).to.equal('f@b.co');
        });

        it('reads an array of emails', () => {
            expect(Envapter.getUsing('EMAILS', Converters.array({ of: Converters.Email }), [])).to.deep.equal([
                'a@x.com',
                'b@y.com'
            ]);
        });

        it('getRequired returns a valid email', () => {
            expect(Envapter.getRequired('EMAIL_VALID', Converters.Email)).to.equal('a@b.com');
        });

        it('getRequired throws on an invalid email', () => {
            expect(() => Envapter.getRequired('EMAIL_NOAT', Converters.Email))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('rejects a non-email fallback', () => {
            expect(() => Envapter.getUsing('EMAIL_VALID', Converters.Email, 'not-an-email'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('rejects an empty-string fallback', () => {
            expect(() => Envapter.getUsing('EMAIL_VALID', Converters.Email, ''))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });

        it('throws on a non-string fallback', () => {
            // cast bypasses the compile-time guard so the runtime email type-checker reject path runs
            expect(() => Envapter.getUsing('EMAIL_VALID', Converters.Email, 42 as unknown as string))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
        });
    });
});
