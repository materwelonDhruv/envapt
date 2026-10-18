import { resolve } from 'node:path';

import { type as ark } from 'arktype';
import * as v from 'valibot';
import { afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod/v4';

import { Converters, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/infra/Error';
import { recase } from '../src/infra/recase';

import type { StandardSchemaV1 } from '../src/infra/StandardSchema';
import type { RecaseKey } from '../src/types';

function thrownBy(read: () => unknown): EnvaptError {
    try {
        read();
    } catch (err) {
        expect(err).to.be.instanceOf(EnvaptError);
        return err as EnvaptError;
    }
    return expect.fail('should have thrown');
}

describe('Required reads (v8)', () => {
    beforeAll(() => {
        Envapter.envPaths = resolve(import.meta.dirname, '.env.037-required-reads');
    });

    afterEach(() => {
        Envapter.strict = false;
    });

    describe('getRequired', () => {
        it('returns a non-undefined typed value for a scalar token', () => {
            const port = Envapter.getRequired('SET_NUMBER', Converters.Number);
            expect(port).to.equal(42);
            expectTypeOf(port).toEqualTypeOf<number>();
        });

        it('returns a non-undefined typed array for an array token', () => {
            const parts = Envapter.getRequired(
                'SAMPLE_REPO',
                Converters.array({ delimiter: '/', of: Converters.String })
            );
            expect(parts).to.deep.equal(['owner', 'repo']);
            expectTypeOf(parts).toEqualTypeOf<string[]>();

            const ports = Envapter.getRequired('PORTS_CLEAN', Converters.array({ of: Converters.Number }));
            expect(ports).to.deep.equal([80, 443, 8080]);
            expectTypeOf(ports).toEqualTypeOf<number[]>();
        });

        it('returns the custom parser return type', () => {
            const upper = Envapter.getRequired('SET_VALUE', (raw) => raw.toUpperCase());
            expect(upper).to.equal('HELLO');
            expectTypeOf(upper).toEqualTypeOf<string>();
        });

        it('throws on missing or empty always, and on whitespace-only only in strict', () => {
            expect(() => Envapter.getRequired('NEVER_SET_KEY', Converters.Number))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);

            expect(() => Envapter.getRequired('EMPTY_VALUE', Converters.String))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);

            // non-strict keeps a whitespace-only value as a real value
            expect(Envapter.getRequired('WHITESPACE_ONLY', Converters.String)).to.equal('   ');

            Envapter.strict = true;
            expect(() => Envapter.getRequired('WHITESPACE_ONLY', Converters.String))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('lists every key of an ordered key list in the missing-value message', () => {
            const e = thrownBy(() => Envapter.getRequired(['NEVER_SET_KEY', 'ALSO_NEVER_SET'], Converters.Number));
            expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
            expect(e.message).to.include('[NEVER_SET_KEY, ALSO_NEVER_SET]');
        });

        it('takes no fallback argument', () => {
            // @ts-expect-error getRequired throws on missing, so it has no fallback parameter
            Envapter.getRequired('SET_NUMBER', Converters.Number, 3000);
        });

        it('returns number for the time converter with no special overload (no fallback to type)', () => {
            const timeout = Envapter.getRequired('TIMEOUT', Converters.Time);
            expect(timeout).to.equal(10000);
            expectTypeOf(timeout).toEqualTypeOf<number>();
        });

        it('falls through an empty ordered key to the first non-empty one', () => {
            const value = Envapter.getRequired(['EMPTY_VALUE', 'SET_VALUE'], Converters.String);
            expect(value).to.equal('hello');
            expectTypeOf(value).toEqualTypeOf<string>();
        });

        it('throws InvalidEnvValue with an issue when a present value cannot be converted', () => {
            const e = thrownBy(() => Envapter.getRequired('SET_VALUE', Converters.Number));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues).to.deep.equal([{ message: 'could not be converted', path: ['SET_VALUE'] }]);
        });

        it('keys the issue by the ordered key that held the value', () => {
            const e = thrownBy(() => Envapter.getRequired(['NEVER_SET_KEY', 'SET_VALUE'], Converters.Number));
            expect(e.issues?.[0]?.path).to.deep.equal(['SET_VALUE']);
        });

        it('reports an error thrown by a custom parser as an issue carrying its message', () => {
            const e = thrownBy(() =>
                Envapter.getRequired('SET_VALUE', () => {
                    throw new RangeError('out of range');
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues).to.deep.equal([{ message: 'out of range', path: ['SET_VALUE'] }]);
        });

        it('returns the schema output for a present value', () => {
            const port = Envapter.getRequired('SET_NUMBER', z.coerce.number().int());
            expect(port).to.equal(42);
            expectTypeOf(port).toEqualTypeOf<number>();
        });

        it('throws MissingEnvValue for a missing value read through a schema', () => {
            expect(() => Envapter.getRequired('NEVER_SET_KEY', z.string()))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('throws InvalidEnvValue with the schema issues keyed by the env name', () => {
            const e = thrownBy(() => Envapter.getRequired('SET_VALUE', z.coerce.number()));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues?.[0]?.path?.[0]).to.equal('SET_VALUE');
        });

        it('reports a bad array element as InvalidEnvValue', () => {
            const e = thrownBy(() => Envapter.getRequired('PORTS_BAD', Converters.array({ of: Converters.Port })));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([['PORTS_BAD']]);
            expect(e.issues?.[0]?.message).to.include('index 1');
        });

        it('reports an empty array element under strict as InvalidEnvValue', () => {
            Envapter.strict = true;
            const e = thrownBy(() => Envapter.getRequired('PORTS_GAP', Converters.array({ of: Converters.Port })));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([['PORTS_GAP']]);
            expect(e.issues?.[0]?.message).to.include('index 1');
        });
    });

    describe('getRequiredAll', () => {
        it('returns a typed non-undefined record for a multi-key spec', () => {
            const cfg = Envapter.getRequiredAll({
                SET_NUMBER: Converters.Number,
                SET_VALUE: Converters.String,
                SAMPLE_REPO: Converters.array({ delimiter: '/' })
            });
            expect(cfg.SET_NUMBER).to.equal(42);
            expect(cfg.SET_VALUE).to.equal('hello');
            expect(cfg.SAMPLE_REPO).to.deep.equal(['owner', 'repo']);
            expectTypeOf(cfg).toEqualTypeOf<{ SET_NUMBER: number; SET_VALUE: string; SAMPLE_REPO: string[] }>();
        });

        it('supports a custom function converter in the spec, inferring its return type', () => {
            const cfg = Envapter.getRequiredAll({
                SET_NUMBER: Converters.Number,
                // eslint-disable-next-line @typescript-eslint/naming-convention -- a function-valued env-name key reads as an object method to the naming rule
                SET_VALUE: (raw) => raw.toUpperCase()
            });
            expect(cfg.SET_NUMBER).to.equal(42);
            expect(cfg.SET_VALUE).to.equal('HELLO');
            expectTypeOf(cfg).toEqualTypeOf<{ SET_NUMBER: number; SET_VALUE: string }>();
        });

        it('recases the record keys when a casing is given, leaving them as-is otherwise', () => {
            const camel = Envapter.getRequiredAll(
                { SAMPLE_REPO: Converters.String, SET_NUMBER: Converters.Number },
                'camelCase'
            );
            expect(camel.sampleRepo).to.equal('owner/repo');
            expect(camel.setNumber).to.equal(42);
            expectTypeOf(camel).toEqualTypeOf<{ sampleRepo: string; setNumber: number }>();

            const pascal = Envapter.getRequiredAll({ SET_NUMBER: Converters.Number }, 'PascalCase');
            expect(pascal.SetNumber).to.equal(42);
            expectTypeOf(pascal).toEqualTypeOf<{ SetNumber: number }>();

            const kebab = Envapter.getRequiredAll({ SET_NUMBER: Converters.Number }, 'kebab-case');
            expect(kebab['set-number']).to.equal(42);
            expectTypeOf(kebab).toEqualTypeOf<{ 'set-number': number }>();

            const asIs = Envapter.getRequiredAll({ SET_NUMBER: Converters.Number });
            expectTypeOf(asIs).toEqualTypeOf<{ SET_NUMBER: number }>();
        });

        it('throws one MissingEnvValue listing every missing key', () => {
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    SET_NUMBER: Converters.Number,
                    NEVER_SET_KEY: Converters.String,
                    EMPTY_VALUE: Converters.String
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
            expect(e.message).to.include('NEVER_SET_KEY');
            expect(e.message).to.include('EMPTY_VALUE');
            expect(e.message).to.not.include('SET_NUMBER');
        });

        it('throws one InvalidEnvValue listing every converter field that cannot convert', () => {
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    SET_VALUE: Converters.Number,
                    SET_NUMBER: Converters.Number,
                    SAMPLE_REPO: Converters.Port
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.message).to.include('SET_VALUE');
            expect(e.message).to.include('SAMPLE_REPO');
            expect(e.message).to.not.include('SET_NUMBER');
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([['SET_VALUE'], ['SAMPLE_REPO']]);
        });
    });

    describe('getRequiredAll with Standard Schema fields', () => {
        it('returns typed values for a spec that mixes converters and schemas', () => {
            const cfg = Envapter.getRequiredAll({
                SET_NUMBER: Converters.Number,
                PORT1: z.coerce.number().int(),
                DATABASE_URL: v.pipe(v.string(), v.url()),
                PORT2: ark('string.integer.parse'),
                SET_VALUE: Converters.String
            });
            expect(cfg).to.deep.equal({
                SET_NUMBER: 42,
                PORT1: 80,
                DATABASE_URL: 'postgres://localhost/db',
                PORT2: 443,
                SET_VALUE: 'hello'
            });
            expectTypeOf(cfg).toEqualTypeOf<{
                SET_NUMBER: number;
                PORT1: number;
                DATABASE_URL: string;
                PORT2: number;
                SET_VALUE: string;
            }>();
        });

        it('throws one InvalidEnvValue holding every failed field, keyed by env name in path', () => {
            const hostSchema: StandardSchemaV1<unknown, string> = {
                '~standard': {
                    version: 1,
                    vendor: 'envapt-test',
                    validate: () => ({ issues: [{ message: 'unknown host', path: ['host'] }] })
                }
            };
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    SET_VALUE: z.coerce.number(),
                    PORT1: z.coerce.number(),
                    SAMPLE_REPO: v.pipe(v.string(), v.email()),
                    DATABASE_URL: hostSchema
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.message).to.include('SET_VALUE');
            expect(e.message).to.include('SAMPLE_REPO');
            expect(e.message).to.include('DATABASE_URL');
            expect(e.message).to.not.include('PORT1');
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([
                ['SET_VALUE'],
                ['SAMPLE_REPO'],
                ['DATABASE_URL', 'host']
            ]);
        });

        it('throws MissingEnvValue for a missing schema field before any schema runs, ignoring its default', () => {
            let validated = false;
            const spySchema: StandardSchemaV1<unknown, string> = {
                '~standard': {
                    version: 1,
                    vendor: 'envapt-test',
                    validate: (value) => {
                        validated = true;
                        return { value: String(value) };
                    }
                }
            };
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    SET_VALUE: spySchema,
                    NEVER_SET_KEY: z.coerce.number().default(3000),
                    EMPTY_VALUE: z.string().default('fallback')
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
            expect(e.message).to.include('NEVER_SET_KEY');
            expect(e.message).to.include('EMPTY_VALUE');
            expect(validated).to.equal(false);
        });

        it('still reports a field whose schema fails with an empty issues array', () => {
            const emptyIssues: StandardSchemaV1<unknown, string> = {
                '~standard': { version: 1, vendor: 'envapt-test', validate: () => ({ issues: [] }) }
            };
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: emptyIssues }));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues).to.deep.equal([{ message: 'no issue message', path: ['SET_VALUE'] }]);
        });

        it('reports a failed schema field and a failed converter field in one error', () => {
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: z.url(), DATABASE_URL: Converters.Port }));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.message).to.include('SET_VALUE');
            expect(e.message).to.include('DATABASE_URL');
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([['SET_VALUE'], ['DATABASE_URL']]);
        });

        it('reports an array field with a bad element next to another bad field in one error', () => {
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    PORTS_BAD: Converters.array({ of: Converters.Port }),
                    SET_VALUE: Converters.Number
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([['PORTS_BAD'], ['SET_VALUE']]);
        });

        it('reports a custom parser that throws as an issue carrying its message', () => {
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    // eslint-disable-next-line @typescript-eslint/naming-convention -- a function-valued env-name key reads as an object method to the naming rule
                    SET_VALUE: (raw) => {
                        if (raw !== 'expected') throw new Error('must be "expected"');
                        return raw;
                    },
                    SAMPLE_REPO: Converters.Number
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues).to.deep.equal([
                { message: 'must be "expected"', path: ['SET_VALUE'] },
                { message: 'could not be converted', path: ['SAMPLE_REPO'] }
            ]);
        });

        it('reports a parser that throws a non-Error value with that value as the message', () => {
            const parseSemver = (): string => {
                // eslint-disable-next-line no-throw-literal, @typescript-eslint/only-throw-error -- third-party parsers can throw plain strings
                throw 'not a semver';
            };
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: parseSemver }));
            expect(e.issues).to.deep.equal([{ message: 'not a semver', path: ['SET_VALUE'] }]);
        });

        it('reports an EnvaptError thrown by a custom parser as an issue', () => {
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    // eslint-disable-next-line @typescript-eslint/naming-convention -- a function-valued env-name key reads as an object method to the naming rule
                    SET_VALUE: () => {
                        throw new EnvaptError(EnvaptErrorCodes.InvalidFallback, 'unknown flag');
                    },
                    SAMPLE_REPO: Converters.Number
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues).to.deep.equal([
                { message: 'unknown flag', path: ['SET_VALUE'] },
                { message: 'could not be converted', path: ['SAMPLE_REPO'] }
            ]);
        });

        it('reports a schema that throws as an issue next to the other bad fields', () => {
            const crashing: StandardSchemaV1<unknown, string> = {
                '~standard': {
                    version: 1,
                    vendor: 'envapt-test',
                    validate: () => {
                        throw new Error('lookup table not loaded');
                    }
                }
            };
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: crashing, SAMPLE_REPO: Converters.Number }));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([['SET_VALUE'], ['SAMPLE_REPO']]);
            expect(e.issues?.[0]?.message).to.include('lookup table not loaded');
        });

        it('reports a zod refine that throws as an issue next to the other bad fields', () => {
            const crashing = z.string().refine(() => {
                throw new Error('refine crashed');
            });
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: crashing, SAMPLE_REPO: Converters.Number }));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([['SET_VALUE'], ['SAMPLE_REPO']]);
        });

        it('copies only the message and path of an arktype issue', () => {
            const integer = ark('string.integer.parse');
            const own = integer['~standard'].validate('hello');
            if (own instanceof Promise || own.issues === undefined) return expect.fail('arktype should reject "hello"');

            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: integer }));
            expect(e.issues).to.deep.equal([{ message: own.issues[0]?.message, path: ['SET_VALUE'] }]);
        });

        it('still throws a spec mistake on its own, outside the aggregated error', () => {
            // cast past the type to reach the runtime check on an unknown token
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: 'not-a-token' as never }));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidCustomConverter);
        });

        it('lists only the failed keys in the message, since a validator can echo a secret value', () => {
            const e = thrownBy(() =>
                Envapter.getRequiredAll({ SAMPLE_REPO: v.pipe(v.string(), v.email()), SET_VALUE: Converters.Number })
            );
            const issueMessage = e.issues?.[0]?.message ?? '';
            expect(issueMessage).to.not.equal('');
            expect(e.message).to.include('SAMPLE_REPO');
            expect(e.message).to.include('SET_VALUE');
            expect(e.message).to.not.include(issueMessage);
        });

        it('keeps a schema field whose schema returns undefined', () => {
            const cfg = Envapter.getRequiredAll({ SET_VALUE: z.string().transform(() => undefined) });
            expect(cfg).to.have.property('SET_VALUE', undefined);
            expectTypeOf(cfg).toEqualTypeOf<{ SET_VALUE: undefined }>();
        });

        it('recases schema field keys the same way as converter keys', () => {
            const cfg = Envapter.getRequiredAll(
                { DATABASE_URL: z.url(), SET_NUMBER: Converters.Number, PORT1: z.coerce.number() },
                'camelCase'
            );
            expect(cfg).to.deep.equal({ databaseUrl: 'postgres://localhost/db', setNumber: 42, port1: 80 });
            expectTypeOf(cfg).toEqualTypeOf<{ databaseUrl: string; setNumber: number; port1: number }>();
        });
    });

    describe('require with ordered key lists', () => {
        it('passes when any key in a list has a value', () => {
            expect(() => Envapter.require(['NEVER_SET_KEY', 'SET_VALUE'], 'SET_NUMBER')).to.not.throw();
        });

        it('lists a whole key list as one missing entry', () => {
            const e = thrownBy(() => Envapter.require(['NEVER_SET_KEY', 'EMPTY_VALUE'], 'SET_NUMBER'));
            expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
            expect(e.message).to.equal('Missing required environment variables: [NEVER_SET_KEY, EMPTY_VALUE].');
        });
    });

    describe('RecaseKey type transforms', () => {
        it('camelCase splits on underscores and lowercases each word', () => {
            expectTypeOf<RecaseKey<'DATABASE_URL', 'camelCase'>>().toEqualTypeOf<'databaseUrl'>();
            expectTypeOf<RecaseKey<'PORT', 'camelCase'>>().toEqualTypeOf<'port'>();
            expectTypeOf<RecaseKey<'OAUTH2_CLIENT_ID', 'camelCase'>>().toEqualTypeOf<'oauth2ClientId'>();
            expectTypeOf<RecaseKey<'H2O_SENSOR', 'camelCase'>>().toEqualTypeOf<'h2oSensor'>();
        });

        it('PascalCase capitalizes every word', () => {
            expectTypeOf<RecaseKey<'DATABASE_URL', 'PascalCase'>>().toEqualTypeOf<'DatabaseUrl'>();
            expectTypeOf<RecaseKey<'PORT', 'PascalCase'>>().toEqualTypeOf<'Port'>();
        });

        it('kebab-case lowercases and joins on hyphens', () => {
            expectTypeOf<RecaseKey<'DATABASE_URL', 'kebab-case'>>().toEqualTypeOf<'database-url'>();
            expectTypeOf<RecaseKey<'PORT', 'kebab-case'>>().toEqualTypeOf<'port'>();
        });

        it('leaves the key unchanged with no casing', () => {
            expectTypeOf<RecaseKey<'DATABASE_URL', undefined>>().toEqualTypeOf<'DATABASE_URL'>();
        });

        it('handles multiple, consecutive, leading, and trailing underscores', () => {
            expectTypeOf<RecaseKey<'A_B_C_D', 'camelCase'>>().toEqualTypeOf<'aBCD'>();
            expectTypeOf<RecaseKey<'A_B_C_D', 'PascalCase'>>().toEqualTypeOf<'ABCD'>();
            expectTypeOf<RecaseKey<'A_B_C_D', 'kebab-case'>>().toEqualTypeOf<'a-b-c-d'>();
            expectTypeOf<RecaseKey<'FOO__BAR', 'camelCase'>>().toEqualTypeOf<'fooBar'>();
            expectTypeOf<RecaseKey<'FOO__BAR', 'kebab-case'>>().toEqualTypeOf<'foo-bar'>();
            expectTypeOf<RecaseKey<'_LEADING_KEY', 'kebab-case'>>().toEqualTypeOf<'leading-key'>();
            expectTypeOf<RecaseKey<'TRAILING_KEY_', 'kebab-case'>>().toEqualTypeOf<'trailing-key'>();
        });
    });

    describe('recase runtime matches RecaseKey', () => {
        it('handles multiple, consecutive, leading, and trailing underscores', () => {
            expect(recase('A_B_C_D', 'camelCase')).to.equal('aBCD');
            expect(recase('A_B_C_D', 'PascalCase')).to.equal('ABCD');
            expect(recase('A_B_C_D', 'kebab-case')).to.equal('a-b-c-d');
            expect(recase('FOO__BAR', 'camelCase')).to.equal('fooBar');
            expect(recase('FOO__BAR', 'kebab-case')).to.equal('foo-bar');
            expect(recase('_LEADING_KEY', 'kebab-case')).to.equal('leading-key');
            expect(recase('TRAILING_KEY_', 'kebab-case')).to.equal('trailing-key');
            expect(recase('PORT')).to.equal('PORT');
        });
    });

    describe('edge cases', () => {
        it('returns an empty record for an empty spec', () => {
            const empty = Envapter.getRequiredAll({});
            expect(empty).to.deep.equal({});
        });

        it('resolves an ordered key list, the first present value wins', () => {
            const port = Envapter.getRequired(['NEVER_SET_KEY', 'SET_NUMBER'], Converters.Number);
            expect(port).to.equal(42);
        });

        it('counts a whitespace-only value as missing only under strict in the aggregated throw', () => {
            const spec = { WHITESPACE_ONLY: Converters.String, NEVER_SET_KEY: Converters.String };

            // non-strict keeps whitespace as a real value, so only the truly-missing key is listed
            const lenient = thrownBy(() => Envapter.getRequiredAll(spec));
            expect(lenient.message).to.include('NEVER_SET_KEY');
            expect(lenient.message).to.not.include('WHITESPACE_ONLY');

            Envapter.strict = true;
            const strict = thrownBy(() => Envapter.getRequiredAll(spec));
            expect(strict.message).to.include('WHITESPACE_ONLY');
            expect(strict.message).to.include('NEVER_SET_KEY');
        });

        it('returns the preserved literal when a template cannot resolve under non-strict', () => {
            Envapter.strict = false;
            expect(Envapter.getRequired('TEMPLATE_MISSING', Converters.String)).to.equal('${NOT_DEFINED_ANYWHERE}');
        });

        it('throws MissingEnvValue when a required template cannot resolve under strict', () => {
            Envapter.strict = true;
            expect(() => Envapter.getRequired('TEMPLATE_MISSING', Converters.String))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        // under strict the template throws before getRequiredAll builds its list of missing keys
        it('surfaces the template error, not the aggregated list, when a spec value is unresolvable under strict', () => {
            Envapter.strict = true;
            const e = thrownBy(() =>
                Envapter.getRequiredAll({ TEMPLATE_MISSING: Converters.String, NEVER_SET_KEY: Converters.String })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
            expect(e.message).to.include('NOT_DEFINED_ANYWHERE');
        });
    });
});
