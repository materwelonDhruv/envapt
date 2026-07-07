import { Primitive, readPrimitive } from './engine';
import { EnvironmentMethods } from './EnvironmentMethods';

import type { ConditionalReturn, EnvKeyInput } from '../types';

/**
 * @internal
 */
export class PrimitiveMethods extends EnvironmentMethods {
    /**
     * Get a string environment variable with optional fallback.
     * Supports template variable resolution using `${VAR}` syntax.
     * Accepts a single key or an ordered array of keys (first match wins).
     * @see {@link https://envapt.materwelon.dev/docs/envapter#primitives}
     */
    static get<Default extends string | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<string, Default> {
        return readPrimitive(key, Primitive.String, def);
    }

    /**
     * @see {@link PrimitiveMethods.get}
     */
    get<Default extends string | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<string, Default> {
        return readPrimitive(key, Primitive.String, def);
    }

    /**
     * Get a number environment variable with optional fallback.
     * Automatically converts string values to numbers.
     * Accepts a single key or an ordered array of keys (first match wins).
     * @see {@link https://envapt.materwelon.dev/docs/envapter#primitives}
     */
    static getNumber<Default extends number | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<number, Default> {
        return readPrimitive(key, Primitive.Number, def);
    }

    /**
     * @see {@link PrimitiveMethods.getNumber}
     */
    getNumber<Default extends number | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<number, Default> {
        return readPrimitive(key, Primitive.Number, def);
    }

    /**
     * Get a boolean environment variable with optional fallback.
     * Recognizes: `1`, `yes`, `true`, `on` as **true**; `0`, `no`, `false`, `off` as **false** (case-insensitive).
     * Accepts a single key or an ordered array of keys (first match wins).
     * @see {@link https://envapt.materwelon.dev/docs/envapter#primitives}
     */
    static getBoolean<Default extends boolean | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<boolean, Default> {
        return readPrimitive(key, Primitive.Boolean, def);
    }

    /**
     * @see {@link PrimitiveMethods.getBoolean}
     */
    getBoolean<Default extends boolean | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<boolean, Default> {
        return readPrimitive(key, Primitive.Boolean, def);
    }

    /**
     * Get a bigint environment variable with optional fallback.
     * Automatically converts string values to bigint.
     * Accepts a single key or an ordered array of keys (first match wins).
     * @see {@link https://envapt.materwelon.dev/docs/envapter#primitives}
     */
    static getBigInt<Default extends bigint | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<bigint, Default> {
        return readPrimitive(key, Primitive.BigInt, def);
    }

    /**
     * @see {@link PrimitiveMethods.getBigInt}
     */
    getBigInt<Default extends bigint | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<bigint, Default> {
        return readPrimitive(key, Primitive.BigInt, def);
    }

    /**
     * Get a symbol environment variable with optional fallback.
     * Creates a symbol from the string value.
     * Accepts a single key or an ordered array of keys (first match wins).
     * @see {@link https://envapt.materwelon.dev/docs/envapter#primitives}
     */
    static getSymbol<Default extends symbol | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<symbol, Default> {
        return readPrimitive(key, Primitive.Symbol, def);
    }

    /**
     * @see {@link PrimitiveMethods.getSymbol}
     */
    getSymbol<Default extends symbol | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<symbol, Default> {
        return readPrimitive(key, Primitive.Symbol, def);
    }
}
