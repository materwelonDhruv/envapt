import { describe, expectTypeOf, it } from 'vitest';

import { Envapter } from '../src';

describe('getter return-type narrowing (compile-time)', () => {
    describe('get (string)', () => {
        it('no fallback => string | undefined', () => {
            expectTypeOf(Envapter.get('KEY')).toEqualTypeOf<string | undefined>();
        });
        it('with fallback => string', () => {
            expectTypeOf(Envapter.get('KEY', 'fallback')).toEqualTypeOf<string>();
        });
    });

    describe('getNumber', () => {
        it('no fallback => number | undefined', () => {
            expectTypeOf(Envapter.getNumber('KEY')).toEqualTypeOf<number | undefined>();
        });
        it('with fallback => number', () => {
            expectTypeOf(Envapter.getNumber('KEY', 3000)).toEqualTypeOf<number>();
        });
    });

    describe('getBoolean', () => {
        it('no fallback => boolean | undefined', () => {
            expectTypeOf(Envapter.getBoolean('KEY')).toEqualTypeOf<boolean | undefined>();
        });
        it('with fallback => boolean', () => {
            expectTypeOf(Envapter.getBoolean('KEY', false)).toEqualTypeOf<boolean>();
        });
    });

    describe('getBigInt', () => {
        it('no fallback => bigint | undefined', () => {
            expectTypeOf(Envapter.getBigInt('KEY')).toEqualTypeOf<bigint | undefined>();
        });
        it('with fallback => bigint', () => {
            expectTypeOf(Envapter.getBigInt('KEY', 0n)).toEqualTypeOf<bigint>();
        });
    });
});
