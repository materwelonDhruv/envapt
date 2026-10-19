import { readPrimitive } from './engine';
import { EnvironmentMethods } from './EnvironmentMethods';

import type { ConditionalReturn, EnvKeyInput } from '../types';

export class PrimitiveMethods extends EnvironmentMethods {
    /**
     * Get a string environment variable, or `fallback` when it is missing or empty. Expands
     * `${VAR}` templates in the value. Accepts a single key or an ordered array of keys, read until
     * one has a value.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#the-primitive-readers}
     */
    static get<Default extends string | undefined = undefined>(
        key: EnvKeyInput,
        fallback?: Default
    ): ConditionalReturn<string, Default> {
        return readPrimitive(key, 'string', fallback);
    }

    /**
     * Get a number environment variable, or `fallback` when it is missing, empty or not a number.
     * Outside strict mode, a value of only whitespace reads as `0`.
     * Accepts a single key or an ordered array of keys, read until one has a value.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#the-primitive-readers}
     */
    static getNumber<Default extends number | undefined = undefined>(
        key: EnvKeyInput,
        fallback?: Default
    ): ConditionalReturn<number, Default> {
        return readPrimitive(key, 'number', fallback);
    }

    /**
     * Get a boolean environment variable, or `fallback` when it is missing, empty or unrecognized.
     * Reads `1`/`yes`/`true`/`on` as `true` and `0`/`no`/`false`/`off` as `false`, ignoring case.
     * Accepts a single key or an ordered array of keys, read until one has a value.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#the-primitive-readers}
     */
    static getBoolean<Default extends boolean | undefined = undefined>(
        key: EnvKeyInput,
        fallback?: Default
    ): ConditionalReturn<boolean, Default> {
        return readPrimitive(key, 'boolean', fallback);
    }

    /**
     * Get a bigint environment variable, or `fallback` when it is missing, empty or not an integer.
     * Accepts a single key or an ordered array of keys, read until one has a value.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#the-primitive-readers}
     */
    static getBigInt<Default extends bigint | undefined = undefined>(
        key: EnvKeyInput,
        fallback?: Default
    ): ConditionalReturn<bigint, Default> {
        return readPrimitive(key, 'bigint', fallback);
    }
}
