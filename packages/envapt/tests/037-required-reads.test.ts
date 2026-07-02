import { resolve } from 'node:path';

import { afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/infra/Error';
import { recase } from '../src/infra/recase';

import type { RecaseKey } from '../src/types';

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

        it('throws MissingEnvValue on missing, empty, or whitespace-only (independent of strict)', () => {
            expect(() => Envapter.getRequired('NEVER_SET_KEY', Converters.Number))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);

            expect(() => Envapter.getRequired('EMPTY_VALUE', Converters.String))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);

            Envapter.strict = false;
            expect(() => Envapter.getRequired('WHITESPACE_ONLY', Converters.String))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.MissingEnvValue);
        });

        it('formats the array-key error message via formatKeyForError', () => {
            try {
                Envapter.getRequired(['NEVER_SET_KEY', 'ALSO_NEVER_SET'], Converters.Number);
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('[NEVER_SET_KEY, ALSO_NEVER_SET]');
            }
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
            try {
                Envapter.getRequiredAll({
                    SET_NUMBER: Converters.Number,
                    NEVER_SET_KEY: Converters.String,
                    EMPTY_VALUE: Converters.String
                });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err).to.be.instanceOf(EnvaptError);
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('NEVER_SET_KEY');
                expect(e.message).to.include('EMPTY_VALUE');
                expect(e.message).to.not.include('SET_NUMBER');
            }
        });
    });

    describe('instance methods delegate to the static ones', () => {
        it('getRequired reads through an instance', () => {
            const env = new Envapter();
            expect(env.getRequired('SET_NUMBER', Converters.Number)).to.equal(42);
        });

        it('getRequiredAll reads through an instance', () => {
            const env = new Envapter();
            const cfg = env.getRequiredAll({ SET_NUMBER: Converters.Number, SET_VALUE: Converters.String });
            expect(cfg.SET_NUMBER).to.equal(42);
            expect(cfg.SET_VALUE).to.equal('hello');
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

        it('treats a whitespace-only value as missing in the aggregated throw', () => {
            try {
                Envapter.getRequiredAll({ WHITESPACE_ONLY: Converters.String, NEVER_SET_KEY: Converters.String });
                expect.fail('should have thrown');
            } catch (err) {
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('WHITESPACE_ONLY');
                expect(e.message).to.include('NEVER_SET_KEY');
            }
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

        // under strict, resolveTemplate throws on the unresolved ${VAR} before the aggregation finishes,
        // so getRequiredAll surfaces that template error rather than the combined missing-key list.
        it('surfaces the template error, not the aggregated list, when a spec value is unresolvable under strict', () => {
            Envapter.strict = true;
            try {
                Envapter.getRequiredAll({ TEMPLATE_MISSING: Converters.String, NEVER_SET_KEY: Converters.String });
                expect.fail('should have thrown');
            } catch (err) {
                const e = err as EnvaptError;
                expect(e.code).to.equal(EnvaptErrorCodes.MissingEnvValue);
                expect(e.message).to.include('NOT_DEFINED_ANYWHERE');
            }
        });
    });
});
