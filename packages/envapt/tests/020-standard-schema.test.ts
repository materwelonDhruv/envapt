import { resolve } from 'node:path';

import { type as ark } from 'arktype';
import { afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { z } from 'zod/v4';

import { Converters, Envapter, EnvaptErrorCodes } from '../src';
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

// SchemaMustBeSync only catches a validate typed to return a Promise
const callableAsync = Object.assign((raw: string) => raw, {
    '~standard': {
        version: 1 as const,
        vendor: 'envapt-test',
        validate: (value: unknown) => Promise.resolve({ value: String(value) })
    }
});

describe('Standard Schema adapter (v5)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.standard-schema');
    });

    afterEach(() => {
        Envapter.strict = false;
    });

    describe('getUsing with a schema: happy paths across vendors', () => {
        it('zod: coerces and validates', () => {
            const port = Envapter.getUsing('PORT', z.coerce.number().int().min(1024).max(65535));
            expect(port).to.equal(8080);
        });

        it('arktype: validates a string→number coercion', () => {
            const port = Envapter.getUsing('PORT', ark('string.integer.parse'));
            expect(port).to.equal(8080);
        });

        it('hand-rolled: works without any schema library', () => {
            const value = Envapter.getUsing('LOG_LEVEL', handRolledUpper);
            expect(value).to.equal('WARN');
        });
    });

    describe('getUsing with a schema: missing handling', () => {
        it('returns undefined when env is absent and there is no fallback', () => {
            const port = Envapter.getUsing('NEVER_SET', z.coerce.number());
            expect(port).to.be.undefined;
            expectTypeOf(port).toEqualTypeOf<number | undefined>();
        });

        it('does NOT validate the fallback through the schema', () => {
            // the schema would reject 'not-a-number'
            const fallback = 'not-a-number';
            const result = Envapter.getUsing(
                'NEVER_SET',
                z.coerce.number(),
                fallback as unknown as number /* fixture cast: testing the no-validation branch -- justified */
            );
            expect(result).to.equal(fallback);
        });

        it('treats an empty value as missing even when the schema would accept it', () => {
            // z.string() accepts an empty string
            expect(Envapter.getUsing('EMPTY', z.string())).to.be.undefined;
            expect(Envapter.getUsing('EMPTY', z.string(), 'fallback')).to.equal('fallback');
        });
    });

    describe('getUsing with a schema: validation failures', () => {
        it('zod: throws SchemaValidationFailed with issues populated', () => {
            try {
                Envapter.getUsing('INVALID_PORT', z.coerce.number().int());
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.SchemaValidationFailed);
                expect(e.issues).to.be.an('array').with.length.greaterThan(0);
            }
        });

        it('lists the env key in the message and keeps the issue text in issues only', () => {
            try {
                Envapter.getUsing('INVALID_PORT', z.coerce.number().int());
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
                Envapter.getUsing('PORT', handRolledEmptyIssues);
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
                Envapter.getUsing(['NEVER_SET', 'URL_VALUE'], hostSchema);
                expect.fail('should have thrown');
            } catch (err) {
                const e = err as EnvaptError;
                expect(e.issues).to.deep.equal([{ message: 'unknown host', path: ['URL_VALUE', 'host'] }]);
            }
        });

        it('non-208 errors have `issues` undefined', () => {
            try {
                Envapter.getRequired('NEVER_SET', z.string());
                expect.fail('should have thrown');
            } catch (err) {
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.issues).to.equal(undefined);
            }
        });
    });

    describe('getUsing with a schema: schema throws unexpectedly', () => {
        it('wraps in EnvaptError(SchemaThrew: 209) and chains via cause', () => {
            try {
                Envapter.getUsing('THROW_ME', handRolledThrower);
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

    describe('getUsing with a schema: async schema defense-in-depth', () => {
        it('runtime rejects Promise-returning validate with InvalidUserDefinedConfig', () => {
            try {
                Envapter.getUsing('PORT', handRolledAsync);
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
                expect(() => Envapter.getUsing('PORT', throwing))
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
                expect(() => Envapter.getUsing('PORT', throwing)).to.throw(EnvaptError);
                await new Promise((resolve) => setTimeout(resolve, 20));
            } finally {
                spy.mockRestore();
                resetDebugForTesting();
            }
            expect(lines.some((line) => line.includes('PORT') && line.includes('refine crashed'))).to.equal(true);
        });
    });

    describe('a callable async schema in a converter slot', () => {
        it('fails to compile in getUsing and getRequired, and throws InvalidUserDefinedConfig past the types', () => {
            // @ts-expect-error the function overload rejects a value with a `~standard` slot
            expect(() => Envapter.getUsing('PORT', callableAsync))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
            // @ts-expect-error the function overload rejects a value with a `~standard` slot
            expect(() => Envapter.getRequired('PORT', callableAsync))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
        });
    });

    describe('a schema as an array element converter', () => {
        it('throws InvalidArrayConverterType for an arktype type passed as `of`', () => {
            // @ts-expect-error `of` rejects a value with a `~standard` slot
            expect(() => Envapter.getUsing('INVALID_PORT', Converters.array({ of: ark('string.integer.parse') })))
                .to.throw(EnvaptError, 'Standard Schema')
                .with.property('code', EnvaptErrorCodes.InvalidArrayConverterType);
        });
    });

    describe('getUsing with a schema: template expansion before validation', () => {
        it('schema sees the post-`${VAR}` value', () => {
            const port = Envapter.getUsing('TEMPLATED_PORT', z.coerce.number());
            expect(port).to.equal(8080);
        });
    });

    describe('@Envapt({ schema }) decorator: happy path', () => {
        class ZodConfig {
            @Envapt('PORT', { schema: z.coerce.number().int().min(1024).max(65535) })
            static readonly port: number | undefined;
        }

        it('zod: validated value reaches the property', () => {
            expect(ZodConfig.port).to.equal(8080);
        });

        // an arktype type is a callable function carrying `~standard`
        it('arktype: validated value reaches the property', () => {
            class ArkConfig {
                @Envapt('PORT', { schema: ark('string.integer.parse') })
                static readonly port: number | undefined;
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
            static readonly value: number | undefined;
        }

        class WithRequired {
            @Envapt('NEVER_SET', { schema: z.coerce.number(), required: true })
            static readonly value: number;
        }

        it('returns the fallback when env is missing (no schema run)', () => {
            expect(WithFallback.value).to.equal(9999);
        });

        it('returns undefined when env is missing and there is no fallback', () => {
            expect(WithoutFallback.value).to.be.undefined;
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
            static readonly port: number | undefined;
        }

        it('throws SchemaValidationFailed at first access', () => {
            expect(() => InvalidPort.port)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.SchemaValidationFailed);
        });

        it('throws InvalidEnvValue under required: true, like getRequired', () => {
            class RequiredInvalidPort {
                @Envapt('INVALID_PORT', { schema: z.coerce.number().int(), required: true })
                static readonly port: number;
            }
            expect(() => RequiredInvalidPort.port)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.InvalidEnvValue);
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
                    static readonly port: number | undefined;
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
                    // @ts-expect-error `converter` rejects a value with a `~standard` slot
                    @Envapt('PORT', { converter: ark('string.integer.parse') })
                    static readonly port: unknown;
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

    describe('Compile-time type narrowing (expect-type)', () => {
        it('getUsing with a schema and a fallback returns the schema output type', () => {
            const port = Envapter.getUsing('NEVER_SET', z.coerce.number(), 3000);
            expectTypeOf(port).toEqualTypeOf<number>();
        });

        it('zod string-enum schema narrows to the union literal', () => {
            const level = Envapter.getUsing('LOG_LEVEL', z.enum(['debug', 'info', 'warn']), 'info');
            expectTypeOf(level).toEqualTypeOf<'debug' | 'info' | 'warn'>();
        });
    });
});
