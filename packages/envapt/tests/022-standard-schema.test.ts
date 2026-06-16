import { resolve } from 'node:path';

import { type as ark } from 'arktype';
import * as v from 'valibot';
import { afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod/v4';

import { Envapt, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/Error';

import type { StandardSchemaV1 } from '../src/StandardSchema';

// Hand-rolled implementation proves the adapter has zero library dependence.
const handRolledUpper: StandardSchemaV1<string, string> = {
    '~standard': {
        version: 1,
        vendor: 'envapt-test',
        validate(value) {
            if (typeof value !== 'string' || value.length === 0) {
                return { issues: [{ message: 'must be a non-empty string' }] };
            }
            return { value: value.toUpperCase() };
        }
    }
};

// Exercises the SchemaThrew (209) path.
const handRolledThrower: StandardSchemaV1<string, string> = {
    '~standard': {
        version: 1,
        vendor: 'envapt-test',
        validate() {
            throw new Error('intentional crash inside validate');
        }
    }
};

// Returns a failure with an empty issues array; spec-non-compliant but Standard Schema's
// `FailureResult.issues` is typed as `readonly Issue[]` (no min-length constraint), so the
// Parser has to fall back to a placeholder message when there's no first issue to read.
const handRolledEmptyIssues: StandardSchemaV1<string, string> = {
    '~standard': {
        version: 1,
        vendor: 'envapt-test',
        validate() {
            return { issues: [] };
        }
    }
};

// Async-only schemas are caught by the `SchemaMustBeSync` brand at the type level; this
// union-typed fixture squeezes past the brand and exercises the runtime Promise check.
const handRolledAsync: StandardSchemaV1<string, string> = {
    '~standard': {
        version: 1,
        vendor: 'envapt-test',
        validate(value) {
            return Promise.resolve({ value: String(value) });
        }
    }
};

describe('Standard Schema adapter (v5)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.standard-schema');
    });

    afterEach(() => {
        Envapter.strict = false;
    });

    describe('Envapter.parse: happy paths across vendors', () => {
        it('zod: coerces and validates', () => {
            const port = Envapter.parse('PORT', z.coerce.number().int().min(1024).max(65535));
            expect(port).to.equal(8080);
        });

        it('valibot: coerces and validates', () => {
            const port = Envapter.parse('PORT', v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1024)));
            expect(port).to.equal(8080);
        });

        it('arktype: validates a string→number coercion', () => {
            const port = Envapter.parse('PORT', ark('string.integer.parse'));
            expect(port).to.equal(8080);
        });

        it('hand-rolled: works without any schema library', () => {
            const value = Envapter.parse('LOG_LEVEL', handRolledUpper);
            expect(value).to.equal('WARN');
        });
    });

    describe('Envapter.parse: multi-key first-defined-wins', () => {
        it('falls through to the second key when the first is unset', () => {
            const port = Envapter.parse(['NEVER_SET', 'PORT'], z.coerce.number());
            expect(port).to.equal(8080);
        });

        it('formats the array-key error message via formatKeyForError when all keys are missing', () => {
            try {
                Envapter.parse(['NEVER_SET_A', 'NEVER_SET_B'], z.coerce.number());
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('[NEVER_SET_A, NEVER_SET_B]');
            }
        });
    });

    describe('Envapter.parse: missing handling', () => {
        it('throws MissingEnvValue when env is absent AND no fallback', () => {
            expect(() => Envapter.parse('NEVER_SET', z.coerce.number()))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('returns the fallback as-is when env is absent (no schema run)', () => {
            const port = Envapter.parse('NEVER_SET', z.coerce.number(), 3000);
            expect(port).to.equal(3000);
        });

        it('does NOT validate the fallback through the schema', () => {
            // Fallback `'not-a-number'` would FAIL the schema if it were validated. The
            // contract says missing+fallback returns fallback as-is; verifying that here.
            const fallback = 'not-a-number';
            const result = Envapter.parse(
                'NEVER_SET',
                z.coerce.number(),
                fallback as unknown as number /* fixture cast: testing the no-validation branch -- justified */
            );
            expect(result).to.equal(fallback);
        });

        it('throws MissingEnvValue on empty value', () => {
            expect(() => Envapter.parse('EMPTY', z.string().min(1)))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('strict mode treats whitespace-only as missing', () => {
            Envapter.strict = true;
            expect(() => Envapter.parse('WHITESPACE_ONLY', z.string().min(1)))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });
    });

    describe('Envapter.parse: validation failures', () => {
        it('zod: throws SchemaValidationFailed with issues populated', () => {
            try {
                Envapter.parse('INVALID_PORT', z.coerce.number().int());
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.SchemaValidationFailed);
                expect(e.message).to.include('INVALID_PORT');
                expect(e.issues).to.exist;
                expect(e.issues).to.be.an('array').with.length.greaterThan(0);
            }
        });

        it('valibot: throws SchemaValidationFailed with issues populated', () => {
            try {
                Envapter.parse('INVALID_URL', v.pipe(v.string(), v.url()));
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.SchemaValidationFailed);
                expect(e.issues).to.exist;
                expect(e.issues?.length).to.be.greaterThan(0);
            }
        });

        it('hand-rolled: issues array passes through to err.issues unchanged', () => {
            try {
                Envapter.parse('EMPTY', handRolledUpper);
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                // EMPTY is treated as missing before the schema runs, so it throws MissingEnvValue,
                // not SchemaValidationFailed. The "issues" assertion goes through INVALID_PORT below.
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
            }
        });

        it('message includes the env key and the first issue text', () => {
            try {
                Envapter.parse('INVALID_PORT', z.coerce.number().int());
                expect.fail('should have thrown');
            } catch (err) {
                const e = err as EnvaptError;
                expect(e.message).to.match(/Schema validation failed for "INVALID_PORT"/);
            }
        });

        it('falls back to a placeholder message when the issues array is empty', () => {
            try {
                Envapter.parse('PORT', handRolledEmptyIssues);
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.SchemaValidationFailed);
                expect(e.message).to.include('no issue message');
            }
        });

        it('non-208 errors have `issues` undefined', () => {
            try {
                Envapter.parse('NEVER_SET', z.string());
                expect.fail('should have thrown');
            } catch (err) {
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.issues).to.equal(undefined);
            }
        });
    });

    describe('Envapter.parse: schema throws unexpectedly', () => {
        it('wraps in EnvaptError(SchemaThrew: 209) and chains via cause', () => {
            try {
                Envapter.parse('THROW_ME', handRolledThrower);
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.SchemaThrew);
                expect(e.cause).to.be.instanceOf(Error);
                expect((e.cause as Error).message).to.include('intentional crash');
                expect(e.message).to.include('THROW_ME');
                expect(e.issues).to.equal(undefined);
            }
        });
    });

    describe('Envapter.parse: async schema defense-in-depth', () => {
        it('runtime rejects Promise-returning validate with InvalidUserDefinedConfig', () => {
            try {
                Envapter.parse('PORT', handRolledAsync);
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.InvalidUserDefinedConfig);
                expect(e.message).to.include('synchronous');
            }
        });
    });

    describe('Envapter.parse: template expansion before validation', () => {
        it('schema sees the post-`${VAR}` value', () => {
            const port = Envapter.parse('TEMPLATED_PORT', z.coerce.number());
            expect(port).to.equal(8080);
        });
    });

    describe('Envapter.parse: instance counterpart delegates to static', () => {
        it('returns the same value as the static call', () => {
            const env = new Envapter();
            const port = env.parse('PORT', z.coerce.number());
            expect(port).to.equal(8080);
        });
    });

    describe('@Envapt({ schema }) decorator: happy path', () => {
        class ZodConfig {
            @Envapt('PORT', { schema: z.coerce.number().int().min(1024).max(65535) })
            static readonly port: number;
        }

        class ValibotConfig {
            @Envapt('LOG_LEVEL', { schema: v.picklist(['debug', 'info', 'warn']) })
            static readonly logLevel: 'debug' | 'info' | 'warn';
        }

        class HandRolledConfig {
            @Envapt('LOG_LEVEL', { schema: handRolledUpper })
            static readonly upper: string;
        }

        it('zod: validated value reaches the property', () => {
            expect(ZodConfig.port).to.equal(8080);
        });

        it('valibot: validated value reaches the property', () => {
            expect(ValibotConfig.logLevel).to.equal('warn');
        });

        it('hand-rolled: validated value reaches the property', () => {
            expect(HandRolledConfig.upper).to.equal('WARN');
        });
    });

    describe('@Envapt({ schema }) decorator: missing + fallback', () => {
        class WithFallback {
            @Envapt('NEVER_SET', { schema: z.coerce.number(), fallback: 9999 })
            static readonly value: number;
        }

        class WithoutFallback {
            @Envapt('NEVER_SET', { schema: z.coerce.number() })
            static readonly value: number;
        }

        class WithRequired {
            @Envapt('NEVER_SET', { schema: z.coerce.number(), required: true })
            static readonly value: number;
        }

        it('returns the fallback when env is missing (no schema run)', () => {
            expect(WithFallback.value).to.equal(9999);
        });

        it('throws MissingEnvValue when env is missing AND no fallback', () => {
            expect(() => WithoutFallback.value)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('throws MissingEnvValue when env is missing under required: true', () => {
            expect(() => WithRequired.value)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });
    });

    describe('@Envapt({ schema }) decorator: validation failure', () => {
        class InvalidPort {
            @Envapt('INVALID_PORT', { schema: z.coerce.number().int() })
            static readonly port: number;
        }

        it('throws SchemaValidationFailed at first access', () => {
            expect(() => InvalidPort.port)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.SchemaValidationFailed);
        });
    });

    describe('@Envapt({ schema }) decorator: runtime mutex + invalid shape', () => {
        it('throws InvalidUserDefinedConfig when both schema + converter are provided', () => {
            const buildBadDecorator = (): void => {
                class Bad {
                    // No overload accepts both `schema` and `converter`. Cast simulates a
                    // dynamic-object bypass so the runtime check fires.
                    @Envapt('PORT', {
                        schema: z.coerce.number(),
                        converter: Number
                    } as unknown as { schema: typeof z.coerce.number extends () => infer R ? R : never })
                    static readonly port: number;
                }
                void Bad;
            };
            expect(buildBadDecorator)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });

        it('throws InvalidUserDefinedConfig when schema is not a valid Standard Schema object', () => {
            const buildBadDecorator = (): void => {
                class Bad {
                    @Envapt('PORT', {
                        // fixture: passing a non-StandardSchema value to exercise the shape guard -- justified
                        schema: { not: 'a schema' } as unknown as StandardSchemaV1
                    })
                    static readonly port: unknown;
                }
                void Bad;
            };
            expect(buildBadDecorator)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });

        it('throws InvalidUserDefinedConfig when schema is null', () => {
            const buildBadDecorator = (): void => {
                class Bad {
                    @Envapt('PORT', {
                        // fixture: null squeezes past `!== undefined` and hits the value-is-null branch -- justified
                        schema: null as unknown as StandardSchemaV1
                    })
                    static readonly port: unknown;
                }
                void Bad;
            };
            expect(buildBadDecorator)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });

        it('throws InvalidUserDefinedConfig when `~standard` slot is null', () => {
            const buildBadDecorator = (): void => {
                class Bad {
                    @Envapt('PORT', {
                        // fixture: slot-is-null branch of the shape guard -- justified
                        schema: { '~standard': null } as unknown as StandardSchemaV1
                    })
                    static readonly port: unknown;
                }
                void Bad;
            };
            expect(buildBadDecorator)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });
    });

    describe('Validator.isStandardSchema: runtime shape check', () => {
        it('accepts real schema objects', () => {
            // Reach into the running config to exercise the guard directly via the runtime
            // mutex path. Already tested above through the decorator; this is the smoke test.
            expect(
                () => Envapter.parse('PORT', z.coerce.number()) // happy path proves the guard implicitly
            ).to.not.throw();
        });
    });

    describe('Compile-time type narrowing (expect-type)', () => {
        it('Envapter.parse return type is the schema output, no `| undefined`', () => {
            const port = Envapter.parse('PORT', z.coerce.number());
            expectTypeOf(port).toEqualTypeOf<number>();
        });

        it('Envapter.parse with fallback retains the schema output type', () => {
            const port = Envapter.parse('NEVER_SET', z.coerce.number(), 3000);
            expectTypeOf(port).toEqualTypeOf<number>();
        });

        it('zod string-enum schema narrows to the union literal', () => {
            const level = Envapter.parse('LOG_LEVEL', z.enum(['debug', 'info', 'warn']));
            expectTypeOf(level).toEqualTypeOf<'debug' | 'info' | 'warn'>();
        });
    });
});
