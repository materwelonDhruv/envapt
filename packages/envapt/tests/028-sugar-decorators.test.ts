import { resolve } from 'node:path';

import { afterEach, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Envapter } from '../src';
import { EnvBool, EnvNum, EnvStr, EnvTime, EnvUrl } from '../src/legacy';

import type { TimeFallback } from '../src';

describe('Sugar decorators', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.sugar-decorators')));
    afterEach(() => (Envapter.strict = false));

    describe('resolve env values through the pinned converter', () => {
        class SugarConfig {
            @EnvNum('SUGAR_PORT', 3000)
            static readonly port: number;

            @EnvStr('SUGAR_REGION', 'us-east-1')
            static readonly region: string;

            @EnvBool('SUGAR_DEBUG', false)
            static readonly debug: boolean;

            @EnvUrl('SUGAR_APP_URL', new URL('http://localhost'))
            static readonly url: URL;

            @EnvTime('SUGAR_CACHE_TTL', '5s')
            static readonly ttl: number;
        }

        it('EnvNum reads a number', () => expect(SugarConfig.port).to.equal(8080));
        it('EnvStr reads a string', () => expect(SugarConfig.region).to.equal('eu-west-1'));
        it('EnvBool reads a boolean', () => expect(SugarConfig.debug).to.equal(true));
        it('EnvUrl reads a URL', () => {
            expect(SugarConfig.url).to.be.instanceOf(URL);
            expect(SugarConfig.url.href).to.equal('https://app.example.com/');
        });
        it('EnvTime reads milliseconds (15m -> 900000)', () => expect(SugarConfig.ttl).to.equal(900000));
    });

    describe('fall back when the env var is missing', () => {
        class SugarDefaults {
            @EnvNum('SUGAR_MISSING_NUM', 3000)
            static readonly port: number;

            @EnvStr('SUGAR_MISSING_STR', 'us-east-1')
            static readonly region: string;

            @EnvBool('SUGAR_MISSING_BOOL', false)
            static readonly flag: boolean;

            @EnvUrl('SUGAR_MISSING_URL', new URL('http://localhost:3000'))
            static readonly url: URL;

            @EnvTime('SUGAR_MISSING_TIME', '10s')
            static readonly ttl: number;

            @EnvNum('SUGAR_MISSING_NO_FALLBACK')
            static readonly none: number | null;
        }

        it('EnvNum uses the numeric fallback', () => expect(SugarDefaults.port).to.equal(3000));
        it('EnvStr uses the string fallback', () => expect(SugarDefaults.region).to.equal('us-east-1'));
        it('EnvBool uses the boolean fallback', () => expect(SugarDefaults.flag).to.equal(false));
        it('EnvUrl coerces the string fallback to a URL', () => {
            expect(SugarDefaults.url).to.be.instanceOf(URL);
            expect(SugarDefaults.url.href).to.equal('http://localhost:3000/');
        });
        it('EnvTime coerces the time-string fallback to milliseconds (10s -> 10000)', () =>
            expect(SugarDefaults.ttl).to.equal(10000));
        it('no fallback resolves to null, like @Envapt(key)', () => expect(SugarDefaults.none).to.be.null);
    });

    describe('multi-key ordered fallback (inherited)', () => {
        class SugarMultiKey {
            @EnvUrl(['SUGAR_CANARY_URL', 'SUGAR_APP_URL'])
            static readonly url: URL | null;

            @EnvNum(['SUGAR_MISSING_PORT', 'SUGAR_LEGACY_PORT'])
            static readonly port: number | null;
        }

        it('picks the first defined key', () => expect(SugarMultiKey.url?.href).to.equal('https://app.example.com/'));
        it('falls through to a later key', () => expect(SugarMultiKey.port).to.equal(9090));
    });

    describe('strict mode (inherited path)', () => {
        class SugarStrict {
            @EnvStr('SUGAR_BLANK', 'fallback-region')
            static readonly region: string;
        }

        it('treats a whitespace-only value as missing and uses the fallback', () => {
            Envapter.strict = true;
            expect(SugarStrict.region).to.equal('fallback-region');
        });
    });

    describe('fallback parameter types are exact (monomorphic)', () => {
        it('each sugar decorator pins its fallback type', () => {
            expectTypeOf(EnvNum).parameter(1).toEqualTypeOf<number | undefined>();
            expectTypeOf(EnvStr).parameter(1).toEqualTypeOf<string | undefined>();
            expectTypeOf(EnvBool).parameter(1).toEqualTypeOf<boolean | undefined>();
            expectTypeOf(EnvUrl).parameter(1).toEqualTypeOf<URL | undefined>();
            expectTypeOf(EnvTime).parameter(1).toEqualTypeOf<TimeFallback | undefined>();
        });
    });

    describe('reject a mismatched fallback at compile time', () => {
        // These fields are never read; the assertion is that each line fails to type-check.
        class SugarInvalid {
            // @ts-expect-error fallback must be a number
            @EnvNum('X', 'nope')
            static readonly a: number;

            // @ts-expect-error fallback must be a string
            @EnvStr('X', 123)
            static readonly b: string;

            // @ts-expect-error fallback must be a boolean
            @EnvBool('X', 1)
            static readonly c: boolean;

            // @ts-expect-error fallback is a URL instance, not the string form
            @EnvUrl('X', 'http://x')
            static readonly d: URL;

            // @ts-expect-error fallback must be a number or a time string
            @EnvTime('X', true)
            static readonly e: number;
        }

        it('compiles only because the cases above are @ts-expect-error', () => {
            expect(SugarInvalid).to.be.a('function');
        });
    });
});
