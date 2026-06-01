import { resolve } from 'node:path';

import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import { afterEach, beforeAll, describe, it } from 'vitest';

import { Converters, Envapt, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/Error';

describe('Strict mode + required (v5)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.strict-mode');
    });

    afterEach(() => {
        // Always reset strict to false so test isolation holds: leaking strict=true into the
        // next file would change get* semantics globally.
        Envapter.strict = false;
    });

    describe('Envapter.strict toggle', () => {
        it('defaults to false', () => {
            expect(Envapter.strict).to.equal(false);
        });

        it('round-trips set/get', () => {
            Envapter.strict = true;
            expect(Envapter.strict).to.equal(true);
            Envapter.strict = false;
            expect(Envapter.strict).to.equal(false);
        });

        it('toggling refreshes cache so subsequent reads see new rules', () => {
            Envapter.strict = false;
            expect(Envapter.get('WHITESPACE_ONLY')).to.equal('   ');

            Envapter.strict = true;
            expect(Envapter.get('WHITESPACE_ONLY')).to.equal(undefined);
        });
    });

    describe('Strict mode + empty values on read', () => {
        it('treats whitespace-only as missing (no fallback)', () => {
            Envapter.strict = true;
            expect(Envapter.get('WHITESPACE_ONLY')).to.equal(undefined);
        });

        it('uses the fallback when the value is whitespace-only', () => {
            Envapter.strict = true;
            expect(Envapter.get('WHITESPACE_ONLY', 'default')).to.equal('default');
        });

        it('off-mode keeps whitespace-only intact (no behavior change)', () => {
            Envapter.strict = false;
            expect(Envapter.get('WHITESPACE_ONLY')).to.equal('   ');
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
        class RequiredOk {
            @Envapt('API_KEY', { required: true })
            declare static readonly key: string;
        }

        class RequiredMissing {
            @Envapt('NEVER_SET_KEY', { required: true })
            declare static readonly key: string;
        }

        class RequiredEmpty {
            @Envapt('EMPTY_VALUE', { required: true })
            declare static readonly key: string;
        }

        class RequiredWhitespace {
            @Envapt('WHITESPACE_ONLY', { required: true })
            declare static readonly key: string;
        }

        class RequiredWithConverter {
            @Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
            declare static readonly url: URL;
        }

        // Exercises the `Array.isArray(key)` arm of `formatKeyForError`; both keys must be
        // absent so the throw path runs.
        class RequiredArrayKeyAllMissing {
            @Envapt(['NEVER_SET_KEY', 'ALSO_NEVER_SET'], { required: true })
            declare static readonly key: string;
        }

        it('returns the value when the env variable is set', () => {
            expect(RequiredOk.key).to.equal('secret-key');
        });

        it('throws MissingEnvValue when the key is absent', () => {
            expect(() => RequiredMissing.key)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('throws MissingEnvValue on empty value (KEY=)', () => {
            expect(() => RequiredEmpty.key)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('throws MissingEnvValue on whitespace-only value (independent of global strict)', () => {
            Envapter.strict = false;
            expect(() => RequiredWhitespace.key)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('returns the typed value when required is paired with a converter', () => {
            expect(RequiredWithConverter.url).to.be.instanceOf(URL);
            expect(RequiredWithConverter.url.toString()).to.equal('postgres://localhost/db');
        });

        it('formats the error message with `[K1, K2]` when given an array of keys (all missing)', () => {
            try {
                void RequiredArrayKeyAllMissing.key;
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('[NEVER_SET_KEY, ALSO_NEVER_SET]');
            }
        });

        it('rejects required + fallback at runtime with InvalidUserDefinedConfig', () => {
            const buildBadDecorator = (): void => {
                class Bad {
                    // The overload tower has no branch that accepts `required: true` alongside
                    // `fallback`, so the type system rejects this at the call site. The runtime
                    // check is defense for dynamic objects that bypass the types.
                    @Envapt('NEVER_SET_KEY', {
                        required: true,
                        // intentionally bad combo, runtime should reject -- justified
                        fallback: 'should-not-be-here'
                    } as unknown as { required: true })
                    declare static readonly key: string;
                }
                void Bad;
            };
            expect(buildBadDecorator)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });
    });

    describe('Functional API options-bag with required: true', () => {
        it('getUsing throws MissingEnvValue on missing/empty', () => {
            expect(() => Envapter.getUsing('NEVER_SET_KEY', { converter: Converters.Number, required: true }))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);

            expect(() => Envapter.getUsing('EMPTY_VALUE', { converter: Converters.Number, required: true }))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('getUsing returns the typed value when present', () => {
            const n = Envapter.getUsing('SET_NUMBER', { converter: Converters.Number, required: true });
            expect(n).to.equal(42);
        });

        it('getWith throws MissingEnvValue on missing/empty', () => {
            expect(() =>
                Envapter.getWith('NEVER_SET_KEY', { converter: (raw) => (raw ?? '').toUpperCase(), required: true })
            )
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('getWith returns the value from the custom converter when present', () => {
            const v = Envapter.getWith('SET_VALUE', { converter: (raw) => (raw ?? '').toUpperCase(), required: true });
            expect(v).to.equal('HELLO');
        });

        it('getUsing formats the array-key error message via formatKeyForError', () => {
            try {
                Envapter.getUsing(['NEVER_SET_KEY', 'ALSO_NEVER_SET'], {
                    converter: Converters.Number,
                    required: true
                });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('[NEVER_SET_KEY, ALSO_NEVER_SET]');
            }
        });

        it('getWith formats the array-key error message via formatKeyForError', () => {
            try {
                Envapter.getWith(['NEVER_SET_KEY', 'ALSO_NEVER_SET'], {
                    converter: (raw) => (raw ?? '').toUpperCase(),
                    required: true
                });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('[NEVER_SET_KEY, ALSO_NEVER_SET]');
            }
        });
    });

    describe('Envapter.require()', () => {
        it('does not throw when a single key is set', () => {
            expect(() => Envapter.require('API_KEY')).to.not.throw();
        });

        it('templates that resolve to a non-empty value pass the check', () => {
            expect(() => Envapter.require('TEMPLATED_OK')).to.not.throw();
        });

        it('throws MissingEnvValue when a single key is absent', () => {
            expect(() => Envapter.require('NEVER_SET_KEY'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('throws MissingEnvValue on empty value', () => {
            expect(() => Envapter.require('EMPTY_VALUE'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('throws MissingEnvValue on whitespace-only value (independent of global strict)', () => {
            Envapter.strict = false;
            expect(() => Envapter.require('WHITESPACE_ONLY'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('returns void when every key is present', () => {
            expect(() => Envapter.require('API_KEY', 'SET_VALUE', 'DATABASE_URL')).to.not.throw();
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

        it('instance counterpart delegates to static', () => {
            const env = new Envapter();
            expect(() => env.require('API_KEY')).to.not.throw();
            expect(() => env.require('NEVER_SET_KEY'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });
    });

    describe('compile-time type checks (expect-type)', () => {
        it('getUsing options-bag with required: true narrows away undefined for built-in converters', () => {
            const port = Envapter.getUsing('SET_NUMBER', { converter: Converters.Number, required: true });
            expectTypeOf(port).toEqualTypeOf<number>();

            const url = Envapter.getUsing('DATABASE_URL', { converter: Converters.Url, required: true });
            expectTypeOf(url).toEqualTypeOf<URL>();
        });

        it('getUsing options-bag with required: true narrows array converters too', () => {
            const ports = Envapter.getUsing('PORTS_CLEAN', {
                converter: Converters.array({ of: Converters.Number }),
                required: true
            });
            expectTypeOf(ports).toEqualTypeOf<number[]>();
        });

        it('getWith options-bag with required: true returns the converter function return type', () => {
            const upper = Envapter.getWith('SET_VALUE', {
                converter: (raw) => (raw ?? '').toUpperCase(),
                required: true
            });
            expectTypeOf(upper).toEqualTypeOf<string>();
        });

        it('Envapter.require returns void for any number of keys', () => {
            const single = Envapter.require('API_KEY');
            const bulk = Envapter.require('API_KEY', 'DATABASE_URL');
            /* eslint-disable @typescript-eslint/no-invalid-void-type -- expect-type's toEqualTypeOf<void>() is the documented assertion form for a void return. */
            expectTypeOf(single).toEqualTypeOf<void>();
            expectTypeOf(bulk).toEqualTypeOf<void>();
            /* eslint-enable @typescript-eslint/no-invalid-void-type */
        });

        it('positional getUsing still narrows by fallback presence (unchanged)', () => {
            const noFallback = Envapter.getUsing('SET_NUMBER', Converters.Number);
            expectTypeOf(noFallback).toEqualTypeOf<number | undefined>();

            const withFallback = Envapter.getUsing('SET_NUMBER', Converters.Number, 3000);
            expectTypeOf(withFallback).toEqualTypeOf<number>();
        });

        it('decorator: required + fallback combo is a TS error AND a runtime error', () => {
            expect(() => {
                class Bad {
                    // @ts-expect-error `required: true` and `fallback` are mutually exclusive
                    @Envapt('PORT', { converter: Converters.Number, required: true, fallback: 3000 })
                    declare static readonly port: number;
                }
                void Bad;
            })
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });

        it('functional getUsing: required + fallback combo is a TS error (excess property)', () => {
            // No runtime mutex check on the functional path, so only the compile-time
            // directive is asserted here.
            // @ts-expect-error fallback not allowed when required: true
            Envapter.getUsing('SET_NUMBER', { converter: Converters.Number, required: true, fallback: 3000 });
        });
    });

    describe('Strict mode does NOT make missing keys throw on get*', () => {
        // Locked behavior: strict tightens "empty value" semantics; it doesn't auto-require
        // every absent key. That stays an explicit opt-in via `required:` or `Envapter.require()`.
        it('returns undefined for missing keys under strict (no fallback)', () => {
            Envapter.strict = true;
            expect(Envapter.get('NEVER_SET_KEY')).to.equal(undefined);
        });

        it('returns the fallback for missing keys under strict', () => {
            Envapter.strict = true;
            expect(Envapter.get('NEVER_SET_KEY', 'default')).to.equal('default');
        });
    });
});
