import { resolve } from 'node:path';

import { afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/infra/Error';
import { Envapt } from '../src/legacy';

describe('Strict mode + required (v5)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.strict-mode');
    });

    afterEach(() => {
        // reset strict so it doesn't leak into the next file and change get* semantics globally
        Envapter.strict = false;
    });

    describe('Strict mode + empty values on read', () => {
        it('defaults to false', () => {
            expect(Envapter.strict).to.equal(false);
        });

        it('toggling refreshes cache so subsequent reads see new rules', () => {
            Envapter.strict = false;
            expect(Envapter.get('WHITESPACE_ONLY')).to.equal('   ');

            Envapter.strict = true;
            expect(Envapter.get('WHITESPACE_ONLY')).to.equal(undefined);
        });

        it('uses the fallback when the value is whitespace-only', () => {
            Envapter.strict = true;
            expect(Envapter.get('WHITESPACE_ONLY', 'default')).to.equal('default');
        });

        it('returns undefined for missing keys under strict', () => {
            Envapter.strict = true;
            expect(Envapter.get('NEVER_SET_KEY')).to.equal(undefined);
        });
    });

    describe('Strict mode + array empty items', () => {
        it('throws EmptyArrayElement on empty/whitespace items', () => {
            Envapter.strict = true;
            expect(() => Envapter.getUsing('PORTS_WITH_EMPTY', Converters.array({ of: Converters.Number })))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.EmptyArrayElement);
        });

        it('does NOT throw under strict OFF (existing permissive behavior preserved)', () => {
            Envapter.strict = false;
            const ports = Envapter.getUsing('PORTS_WITH_EMPTY', Converters.array({ of: Converters.Number }));
            expect(ports).to.deep.equal([80, 443]);
        });

        it('processes clean arrays normally under strict ON', () => {
            Envapter.strict = true;
            const ports = Envapter.getUsing('PORTS_CLEAN', Converters.array({ of: Converters.Number }));
            expect(ports).to.deep.equal([80, 443, 8080]);
        });
    });

    describe('Strict mode + unresolved templates', () => {
        it('throws MissingEnvValue when a ${VAR} cannot be resolved', () => {
            Envapter.strict = true;
            expect(() => Envapter.get('TEMPLATED_MISSING'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('preserves the literal ${VAR} under strict OFF (existing behavior)', () => {
            Envapter.strict = false;
            expect(Envapter.get('TEMPLATED_MISSING')).to.equal('value-${ABSENT}');
        });

        it('resolves templates normally when the referenced var IS set', () => {
            Envapter.strict = true;
            expect(Envapter.get('TEMPLATED_OK')).to.equal('value-hello');
        });

        it('strict applies to resolve() tagged template too', () => {
            Envapter.strict = true;
            expect(() => Envapter.resolve`hello ${'ABSENT'}`)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });
    });

    describe('Decorator @Envapt({ required: true })', () => {
        class RequiredMissing {
            @Envapt('NEVER_SET_KEY', { required: true })
            static readonly key: string;
        }

        class RequiredWhitespace {
            @Envapt('WHITESPACE_ONLY', { required: true })
            static readonly key: string;
        }

        class RequiredWithConverter {
            @Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
            static readonly url: URL;
        }

        it('throws MissingEnvValue when the key is absent', () => {
            expect(() => RequiredMissing.key)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('keeps a whitespace-only required value non-strict, and throws under strict', () => {
            Envapter.strict = false;
            expect(RequiredWhitespace.key).to.equal('   ');

            Envapter.strict = true;
            class RequiredWhitespaceStrict {
                @Envapt('WHITESPACE_ONLY', { required: true })
                static readonly key: string;
            }
            expect(() => RequiredWhitespaceStrict.key)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('throws InvalidEnvValue when the converter cannot convert a present value', () => {
            class RequiredUnconvertible {
                @Envapt('API_KEY', { converter: Converters.Number, required: true })
                static readonly key: number;
            }
            expect(() => RequiredUnconvertible.key)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidEnvValue);
        });

        it('converts through a primitive constructor and throws InvalidEnvValue when it cannot', () => {
            class RequiredNumber {
                @Envapt('SET_NUMBER', { converter: Number, required: true })
                static readonly count: number;

                @Envapt('API_KEY', { converter: Number, required: true })
                static readonly notANumber: number;
            }
            expect(RequiredNumber.count).to.equal(42);
            expect(() => RequiredNumber.notANumber)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidEnvValue);
        });

        it('returns the typed value when required is paired with a converter', () => {
            expect(RequiredWithConverter.url.toString()).to.equal('postgres://localhost/db');
        });

        it('rejects required + fallback at compile time and at runtime', () => {
            expect(() => {
                class Bad {
                    // @ts-expect-error `required: true` and `fallback` are mutually exclusive
                    @Envapt('PORT', { converter: Converters.Number, required: true, fallback: 3000 })
                    static readonly port: number;
                }
                void Bad;
            })
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });
    });

    describe('Envapter.require()', () => {
        it('templates that resolve to a non-empty value pass the check', () => {
            expect(() => Envapter.require('TEMPLATED_OK')).to.not.throw();
        });

        it('passes a whitespace-only value non-strict, and throws under strict', () => {
            Envapter.strict = false;
            expect(() => Envapter.require('WHITESPACE_ONLY')).to.not.throw();

            Envapter.strict = true;
            expect(() => Envapter.require('WHITESPACE_ONLY'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('throws and lists every missing key in one error', () => {
            try {
                Envapter.require('API_KEY', 'NEVER_SET_KEY', 'EMPTY_VALUE', 'SET_VALUE');
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('NEVER_SET_KEY');
                expect(e.message).to.include('EMPTY_VALUE');
                expect(e.message).to.not.include('API_KEY');
                expect(e.message).to.not.include('SET_VALUE');
            }
        });
    });

    it('getUsing narrows by fallback presence', () => {
        const noFallback = Envapter.getUsing('SET_NUMBER', Converters.Number);
        expectTypeOf(noFallback).toEqualTypeOf<number | undefined>();

        const withFallback = Envapter.getUsing('SET_NUMBER', Converters.Number, 3000);
        expectTypeOf(withFallback).toEqualTypeOf<number>();
    });
});
