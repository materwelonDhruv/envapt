import { describe, expectTypeOf, it } from 'vitest';

import { Envapter } from '../src';

/**
 * Regression guard: instance `get` once carried a stray `get(key, def?: string): string | undefined`
 * overload that shadowed its conditional return, so `env.get('K', 'fallback')` widened to
 * `string | undefined`. These compile-time assertions pin the fallback-narrowing of every
 * primitive getter (static and instance), so reintroducing the overload fails `pnpm tc`.
 */
describe('getter return-type narrowing (compile-time)', () => {
    const env = new Envapter();

    describe('get (string)', () => {
        it('no fallback => string | undefined', () => {
            expectTypeOf(Envapter.get('KEY')).toEqualTypeOf<string | undefined>();
            expectTypeOf(env.get('KEY')).toEqualTypeOf<string | undefined>();
        });
        it('with fallback => string', () => {
            expectTypeOf(Envapter.get('KEY', 'fallback')).toEqualTypeOf<string>();
            expectTypeOf(env.get('KEY', 'fallback')).toEqualTypeOf<string>();
        });
    });

    describe('getNumber', () => {
        it('no fallback => number | undefined', () => {
            expectTypeOf(Envapter.getNumber('KEY')).toEqualTypeOf<number | undefined>();
            expectTypeOf(env.getNumber('KEY')).toEqualTypeOf<number | undefined>();
        });
        it('with fallback => number', () => {
            expectTypeOf(Envapter.getNumber('KEY', 3000)).toEqualTypeOf<number>();
            expectTypeOf(env.getNumber('KEY', 3000)).toEqualTypeOf<number>();
        });
    });

    describe('getBoolean', () => {
        it('no fallback => boolean | undefined', () => {
            expectTypeOf(Envapter.getBoolean('KEY')).toEqualTypeOf<boolean | undefined>();
            expectTypeOf(env.getBoolean('KEY')).toEqualTypeOf<boolean | undefined>();
        });
        it('with fallback => boolean', () => {
            expectTypeOf(Envapter.getBoolean('KEY', false)).toEqualTypeOf<boolean>();
            expectTypeOf(env.getBoolean('KEY', false)).toEqualTypeOf<boolean>();
        });
    });

    describe('getBigInt', () => {
        it('no fallback => bigint | undefined', () => {
            expectTypeOf(Envapter.getBigInt('KEY')).toEqualTypeOf<bigint | undefined>();
            expectTypeOf(env.getBigInt('KEY')).toEqualTypeOf<bigint | undefined>();
        });
        it('with fallback => bigint', () => {
            expectTypeOf(Envapter.getBigInt('KEY', 0n)).toEqualTypeOf<bigint>();
            expectTypeOf(env.getBigInt('KEY', 0n)).toEqualTypeOf<bigint>();
        });
    });

    describe('getSymbol', () => {
        it('no fallback => symbol | undefined', () => {
            expectTypeOf(Envapter.getSymbol('KEY')).toEqualTypeOf<symbol | undefined>();
            expectTypeOf(env.getSymbol('KEY')).toEqualTypeOf<symbol | undefined>();
        });
        it('with fallback => symbol', () => {
            expectTypeOf(Envapter.getSymbol('KEY', Symbol('fallback'))).toEqualTypeOf<symbol>();
            expectTypeOf(env.getSymbol('KEY', Symbol('fallback'))).toEqualTypeOf<symbol>();
        });
    });
});
