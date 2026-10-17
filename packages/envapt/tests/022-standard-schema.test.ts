import { resolve } from 'node:path';

import { type as ark } from 'arktype';
import * as v from 'valibot';
import { afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { z } from 'zod/v4';

import { Envapter, EnvaptErrorCodes } from '../src';
import { resetDebugForTesting } from '../src/infra/Debug';
import { EnvaptError } from '../src/infra/Error';
import { Envapt } from '../src/legacy';

import type { StandardSchemaV1 } from '../src/infra/StandardSchema';

// hand-rolled to prove the adapter needs no schema library
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

// drives the SchemaThrew (209) path
const handRolledThrower: StandardSchemaV1<string, string> = {
    '~standard': {
        version: 1,
        vendor: 'envapt-test',
        validate() {
            throw new Error('intentional crash inside validate');
        }
    }
};

// the spec expects at least one issue, and the `readonly Issue[]` type still allows an empty array
const handRolledEmptyIssues: StandardSchemaV1<string, string> = {
    '~standard': {
        version: 1,
        vendor: 'envapt-test',
        validate() {
            return { issues: [] };
        }
    }
};

// the union type gets past the SchemaMustBeSync brand to reach the runtime Promise check
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

        it('lists every key of an ordered key list in the missing-value message', () => {
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
            // the schema would reject 'not-a-number'
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

        it('throws MissingEnvValue on empty even when the schema would accept it', () => {
            // z.string() accepts an empty string
            expect(() => Envapter.parse('EMPTY', z.string()))
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
                // EMPTY counts as missing before the schema runs
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
            }
        });

        it('lists the env key in the message and keeps the issue text in issues only', () => {
            try {
                Envapter.parse('INVALID_PORT', z.coerce.number().int());
                expect.fail('should have thrown');
            } catch (err) {
                const e = err as EnvaptError;
                const issueMessage = e.issues?.[0]?.message ?? '';
                expect(issueMessage).to.not.equal('');
                expect(e.message).to.include('INVALID_PORT');
                expect(e.message).to.not.include(issueMessage);
            }
        });

        it('throws SchemaValidationFailed when the schema fails with an empty issues array', () => {
            try {
                Envapter.parse('PORT', handRolledEmptyIssues);
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.SchemaValidationFailed);
                expect(e.issues).to.deep.equal([{ message: 'no issue message', path: ['PORT'] }]);
            }
        });

        it('starts every issue path with the ordered key that held the value', () => {
            const hostSchema: StandardSchemaV1<unknown, string> = {
                '~standard': {
                    version: 1,
                    vendor: 'envapt-test',
                    validate: () => ({ issues: [{ message: 'unknown host', path: ['host'] }] })
                }
            };
            try {
                Envapter.parse(['NEVER_SET', 'URL_VALUE'], hostSchema);
                expect.fail('should have thrown');
            } catch (err) {
                const e = err as EnvaptError;
                expect(e.issues).to.deep.equal([{ message: 'unknown host', path: ['URL_VALUE', 'host'] }]);
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

        // zod's validate returns a rejecting Promise when a transform throws
        it('leaves no unhandled rejection behind when the schema returns a rejecting Promise', async () => {
            const unhandled: unknown[] = [];
            const record = (reason: unknown): void => {
                unhandled.push(reason);
            };
            process.on('unhandledRejection', record);
            try {
                const throwing = z.string().transform(() => {
                    throw new Error('transform crashed');
                });
                expect(() => Envapter.parse('PORT', throwing))
                    .to.throw(EnvaptError)
                    .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
                await new Promise((resolve) => setTimeout(resolve, 20));
            } finally {
                process.off('unhandledRejection', record);
            }
            expect(unhandled).to.deep.equal([]);
        });

        it('logs the reason of a rejecting Promise under debug warn', async () => {
            const lines: string[] = [];
            const spy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
                lines.push(String(chunk));
                return true;
            });
            Envapter.debug = 'warn';
            try {
                const throwing = z.string().refine(() => {
                    throw new Error('refine crashed');
                });
                expect(() => Envapter.parse('PORT', throwing)).to.throw(EnvaptError);
                await new Promise((resolve) => setTimeout(resolve, 20));
            } finally {
                spy.mockRestore();
                resetDebugForTesting();
            }
            expect(lines.some((line) => line.includes('PORT') && line.includes('refine crashed'))).to.equal(true);
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

        it('lists only the env key in the message when the schema rejects the value', () => {
            class InvalidPortConfig {
                @Envapt('INVALID_PORT', { schema: z.coerce.number().int() })
                static readonly port: number;
            }
            let thrown: unknown;
            try {
                void InvalidPortConfig.port;
            } catch (err) {
                thrown = err;
            }
            expect(thrown).to.be.instanceOf(EnvaptError);
            const e = thrown as EnvaptError;
            const issueMessage = e.issues?.[0]?.message ?? '';
            expect(issueMessage).to.not.equal('');
            expect(e.code).to.equal(EnvaptErrorCodes.SchemaValidationFailed);
            expect(e.issues?.[0]?.path).to.deep.equal(['INVALID_PORT']);
            expect(e.message).to.include('INVALID_PORT');
            expect(e.message).to.not.include(issueMessage);
        });

        // an arktype type is a callable function carrying `~standard`
        it('arktype: validated value reaches the property', () => {
            class ArkConfig {
                @Envapt('PORT', { schema: ark('string.integer.parse') })
                static readonly port: number;
            }
            expect(ArkConfig.port).to.equal(8080);
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
                    // no overload accepts schema with converter
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

        it('throws InvalidUserDefinedConfig when a callable schema is passed as converter', () => {
            const buildBadDecorator = (): void => {
                class Bad {
                    @Envapt('PORT', { converter: ark('string.integer.parse') })
                    static readonly port: unknown;
                }
                void Bad;
            };
            expect(buildBadDecorator)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });

        it('throws InvalidUserDefinedConfig when getWith gets a callable schema', () => {
            expect(() => Envapter.getWith('PORT', ark('string.integer.parse')))
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
