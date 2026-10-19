import { resolve } from 'node:path';

import { type as ark } from 'arktype';
import * as v from 'valibot';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod/v4';

import { Converters, Envapter, EnvaptError, EnvaptErrorCodes, FileSource, PortableSource } from '../src';

import type { StandardSchemaV1 } from '../src';

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
        Envapter.envPaths = resolve(import.meta.dirname, '.env.033-required-reads');
    });

    afterEach(() => {
        Envapter.strict = false;
    });

    describe('getRequired', () => {
        it('returns a non-undefined typed value for a scalar token', () => {
            const port = Envapter.getRequired('SET_NUMBER', Converters.Number);
            expect(port).to.equal(42);
        });

        it('returns a non-undefined typed array for an array token', () => {
            const parts = Envapter.getRequired(
                'SAMPLE_REPO',
                Converters.array({ delimiter: '/', of: Converters.String })
            );
            expect(parts).to.deep.equal(['owner', 'repo']);

            const ports = Envapter.getRequired('PORTS_CLEAN', Converters.array({ of: Converters.Number }));
            expect(ports).to.deep.equal([80, 443, 8080]);
        });

        it('returns a JSON null the way getAs does', () => {
            Envapter.useSource(new PortableSource({ FLAGS: 'null' }));
            try {
                expect(Envapter.getRequired('FLAGS', Converters.Json)).to.equal(null);
            } finally {
                Envapter.useSource(new FileSource());
            }
        });

        it('returns the custom parser return type', () => {
            const upper = Envapter.getRequired('SET_VALUE', (raw) => raw.toUpperCase());
            expect(upper).to.equal('HELLO');
        });

        it('throws MissingEnvValue on a missing or empty value', () => {
            expect(() => Envapter.getRequired('NEVER_SET_KEY', Converters.Number))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);

            expect(() => Envapter.getRequired('EMPTY_VALUE', Converters.String))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('lists every key of an ordered key list in the missing-value message', () => {
            const e = thrownBy(() => Envapter.getRequired(['NEVER_SET_KEY', 'ALSO_NEVER_SET'], Converters.Number));
            expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
            expect(e.message).to.include('[NEVER_SET_KEY, ALSO_NEVER_SET]');
        });

        it('reads a time string as milliseconds', () => {
            expect(Envapter.getRequired('TIMEOUT', Converters.Time)).to.equal(10000);
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

        it('reports an error thrown by a custom parser as an issue, keeping the error as the cause', () => {
            const outOfRange = new RangeError('out of range');
            const e = thrownBy(() =>
                Envapter.getRequired('SET_VALUE', () => {
                    throw outOfRange;
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues).to.deep.equal([{ message: 'out of range', path: ['SET_VALUE'], cause: outOfRange }]);
            expect(e.cause).to.equal(outOfRange);
        });

        it('returns the schema output for a present value', () => {
            const port = Envapter.getRequired('SET_NUMBER', z.coerce.number().int());
            expect(port).to.equal(42);
        });

        it('throws InvalidEnvValue with the schema issues keyed by the env name', () => {
            const e = thrownBy(() => Envapter.getRequired('SET_VALUE', z.coerce.number()));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues?.[0]?.path?.[0]).to.equal('SET_VALUE');
        });

        it('reports a schema that throws as an issue, keeping the error as the cause', () => {
            const notLoaded = new Error('lookup table not loaded');
            const crashing: StandardSchemaV1<unknown, string> = {
                '~standard': {
                    version: 1,
                    vendor: 'envapt-test',
                    validate: () => {
                        throw notLoaded;
                    }
                }
            };
            const e = thrownBy(() => Envapter.getRequired('SET_VALUE', crashing));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues).to.deep.equal([
                { message: 'lookup table not loaded', path: ['SET_VALUE'], cause: notLoaded }
            ]);
            expect(e.cause).to.equal(notLoaded);
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
        });

        it('supports a custom function converter in the spec, inferring its return type', () => {
            const cfg = Envapter.getRequiredAll({
                SET_NUMBER: Converters.Number,
                // eslint-disable-next-line @typescript-eslint/naming-convention -- a function-valued env-name key reads as an object method to the naming rule
                SET_VALUE: (raw) => raw.toUpperCase()
            });
            expect(cfg.SET_NUMBER).to.equal(42);
            expect(cfg.SET_VALUE).to.equal('HELLO');
        });

        it('recases the record keys when a casing is given, leaving them as-is otherwise', () => {
            const camel = Envapter.getRequiredAll(
                { SAMPLE_REPO: Converters.String, SET_NUMBER: Converters.Number },
                'camelCase'
            );
            expect(camel.sampleRepo).to.equal('owner/repo');
            expect(camel.setNumber).to.equal(42);

            const pascal = Envapter.getRequiredAll({ SET_NUMBER: Converters.Number }, 'PascalCase');
            expect(pascal.SetNumber).to.equal(42);

            const kebab = Envapter.getRequiredAll({ SET_NUMBER: Converters.Number }, 'kebab-case');
            expect(kebab['set-number']).to.equal(42);

            const asIs = Envapter.getRequiredAll({ SET_NUMBER: Converters.Number });
            expect(asIs.SET_NUMBER).to.equal(42);
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

        it('reports a failed schema field and a failed converter field in one error', () => {
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: z.url(), DATABASE_URL: Converters.Port }));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues?.map((issue) => issue.path)).to.deep.equal([['SET_VALUE'], ['DATABASE_URL']]);
        });

        it('reports a parser that throws a non-Error value with that value as the message', () => {
            const parseSemver = (): string => {
                // eslint-disable-next-line no-throw-literal, @typescript-eslint/only-throw-error -- third-party parsers can throw plain strings
                throw 'not a semver';
            };
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: parseSemver }));
            expect(e.issues).to.deep.equal([{ message: 'not a semver', path: ['SET_VALUE'], cause: 'not a semver' }]);
        });

        it('keeps the error a custom parser throws as the cause when it is the only thrown one', () => {
            const unknownFlag = new EnvaptError(EnvaptErrorCodes.InvalidFallback, 'unknown flag');
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    // eslint-disable-next-line @typescript-eslint/naming-convention -- a function-valued env-name key reads as an object method to the naming rule
                    SET_VALUE: () => {
                        throw unknownFlag;
                    },
                    SAMPLE_REPO: Converters.Number
                })
            );
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidEnvValue);
            expect(e.issues).to.deep.equal([
                { message: 'unknown flag', path: ['SET_VALUE'], cause: unknownFlag },
                { message: 'could not be converted', path: ['SAMPLE_REPO'] }
            ]);
            expect(e.cause).to.equal(unknownFlag);
        });

        it('leaves each thrown error on its own issue when two parsers throw', () => {
            const badHost = new Error('bad host');
            const badRepo = new Error('bad repo');
            const e = thrownBy(() =>
                Envapter.getRequiredAll({
                    // eslint-disable-next-line @typescript-eslint/naming-convention -- a function-valued env-name key reads as an object method to the naming rule
                    SET_VALUE: () => {
                        throw badHost;
                    },
                    // eslint-disable-next-line @typescript-eslint/naming-convention -- a function-valued env-name key reads as an object method to the naming rule
                    SAMPLE_REPO: () => {
                        throw badRepo;
                    }
                })
            );
            expect(e.issues?.map((issue) => issue.cause)).to.deep.equal([badHost, badRepo]);
            expect(e.cause).to.equal(undefined);
        });

        // zod returns a rejecting Promise when a refine throws
        it('throws InvalidUserDefinedConfig on its own for a zod refine that throws', () => {
            const crashing = z.string().refine(() => {
                throw new Error('refine crashed');
            });
            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: crashing, SAMPLE_REPO: Converters.Number }));
            expect(e.code).to.equal(EnvaptErrorCodes.InvalidUserDefinedConfig);
            expect(e.issues).to.equal(undefined);
        });

        it('copies only the message and path of an arktype issue', () => {
            const integer = ark('string.integer.parse');
            const own = integer['~standard'].validate('hello');
            if (own instanceof Promise || own.issues === undefined) return expect.fail('arktype should reject "hello"');

            const e = thrownBy(() => Envapter.getRequiredAll({ SET_VALUE: integer }));
            expect(e.issues).to.deep.equal([{ message: own.issues[0]?.message, path: ['SET_VALUE'] }]);
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

    describe('key casing', () => {
        it('handles multiple, consecutive, leading, and trailing underscores', () => {
            Envapter.useSource(
                new PortableSource({ A_B_C_D: '1', FOO__BAR: '2', _LEADING_KEY: '3', TRAILING_KEY_: '4' })
            );
            try {
                const spec = {
                    A_B_C_D: Converters.String,
                    FOO__BAR: Converters.String,
                    _LEADING_KEY: Converters.String,
                    TRAILING_KEY_: Converters.String
                };
                expect(Object.keys(Envapter.getRequiredAll(spec, 'camelCase'))).to.deep.equal([
                    'aBCD',
                    'fooBar',
                    'leadingKey',
                    'trailingKey'
                ]);
                expect(Object.keys(Envapter.getRequiredAll(spec, 'PascalCase'))).to.deep.equal([
                    'ABCD',
                    'FooBar',
                    'LeadingKey',
                    'TrailingKey'
                ]);
                expect(Object.keys(Envapter.getRequiredAll(spec, 'kebab-case'))).to.deep.equal([
                    'a-b-c-d',
                    'foo-bar',
                    'leading-key',
                    'trailing-key'
                ]);
            } finally {
                Envapter.useSource(new FileSource());
            }
        });
    });

    describe('edge cases', () => {
        it('returns an empty record for an empty spec', () => {
            const empty = Envapter.getRequiredAll({});
            expect(empty).to.deep.equal({});
        });

        it('counts a whitespace-only value as missing only under strict in the aggregated throw', () => {
            const spec = { WHITESPACE_ONLY: Converters.String, NEVER_SET_KEY: Converters.String };

            // non-strict keeps whitespace as a real value
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
