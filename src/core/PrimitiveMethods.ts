/* eslint-disable tsdoc/syntax */
import { BuiltInConverters } from '../BuiltInConverters';
import { Parser, type EnvapterService } from '../Parser';
import { EnvironmentMethods } from './EnvironmentMethods';

import type { ConditionalReturn, EnvKeyInput } from '../Types';

/**
 * @internal
 */
enum Primitive {
    String,
    Number,
    Boolean,
    BigInt,
    Symbol
}

/**
 * Mixin for primitive environment variable getter methods
 * @internal
 */
export class PrimitiveMethods extends EnvironmentMethods implements EnvapterService {
    protected static readonly parser: Parser = new Parser(new PrimitiveMethods());

    private static _get<EnvVarReturnType, DefaultType extends EnvVarReturnType | undefined = undefined>(
        key: EnvKeyInput,
        type: Primitive,
        def?: DefaultType
    ): ConditionalReturn<EnvVarReturnType, DefaultType> {
        const { key: resolvedKey, value } = this.resolveKeyInput(key);
        const rawVal = value as string | number | boolean | undefined;
        if (!rawVal) return def as ConditionalReturn<EnvVarReturnType, DefaultType>;

        const parsed = this.parser.resolveTemplate(resolvedKey, String(rawVal));

        let result: EnvVarReturnType;
        if (type === Primitive.Number) result = BuiltInConverters.number(parsed, def as number) as EnvVarReturnType;
        else if (type === Primitive.Boolean)
            result = BuiltInConverters.boolean(parsed, def as boolean) as EnvVarReturnType;
        else if (type === Primitive.BigInt)
            result = BuiltInConverters.bigint(parsed, def as bigint) as EnvVarReturnType;
        else if (type === Primitive.Symbol)
            result = BuiltInConverters.symbol(parsed, def as symbol) as EnvVarReturnType;
        else result = BuiltInConverters.string(parsed, def as string) as EnvVarReturnType;

        return result as ConditionalReturn<EnvVarReturnType, DefaultType>;
    }

    /**
     * Get a string environment variable with optional fallback.
     * Supports template variable resolution using \${VAR} syntax.
     * Accepts a single key or an ordered array of keys (first match wins).
     */
    static get<Default extends string | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<string, Default> {
        return this._get(key, Primitive.String, def);
    }

    /**
     * @see {@link PrimitiveMethods.get}
     */
    get(key: EnvKeyInput, def?: string): string | undefined;
    get<Default extends string | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<string, Default> {
        return PrimitiveMethods._get(key, Primitive.String, def);
    }

    /**
     * Get a number environment variable with optional fallback.
     * Automatically converts string values to numbers.
     * Accepts a single key or an ordered array of keys (first match wins).
     */
    static getNumber<Default extends number | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<number, Default> {
        return this._get(key, Primitive.Number, def);
    }

    /**
     * @see {@link PrimitiveMethods.getNumber}
     */
    getNumber<Default extends number | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<number, Default> {
        return PrimitiveMethods._get(key, Primitive.Number, def);
    }

    /**
     * Get a boolean environment variable with optional fallback.
     * Recognizes: `1`, `yes`, `true`, 'on' as **true**; `0`, `no`, `false`, 'off' as **false** (case-insensitive).
     * Accepts a single key or an ordered array of keys (first match wins).
     */
    static getBoolean<Default extends boolean | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<boolean, Default> {
        return this._get(key, Primitive.Boolean, def);
    }

    /**
     * @see {@link PrimitiveMethods.getBoolean}
     */
    getBoolean<Default extends boolean | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<boolean, Default> {
        return PrimitiveMethods._get(key, Primitive.Boolean, def);
    }

    /**
     * Get a bigint environment variable with optional fallback.
     * Automatically converts string values to bigint.
     * Accepts a single key or an ordered array of keys (first match wins).
     */
    static getBigInt<Default extends bigint | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<bigint, Default> {
        return this._get(key, Primitive.BigInt, def);
    }

    /**
     * @see {@link PrimitiveMethods.getBigInt}
     */
    getBigInt<Default extends bigint | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<bigint, Default> {
        return PrimitiveMethods._get(key, Primitive.BigInt, def);
    }

    /**
     * Get a symbol environment variable with optional fallback.
     * Creates a symbol from the string value.
     * Accepts a single key or an ordered array of keys (first match wins).
     */
    static getSymbol<Default extends symbol | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<symbol, Default> {
        return this._get(key, Primitive.Symbol, def);
    }

    /**
     * @see {@link PrimitiveMethods.getSymbol}
     */
    getSymbol<Default extends symbol | undefined = undefined>(
        key: EnvKeyInput,
        def?: Default
    ): ConditionalReturn<symbol, Default> {
        return PrimitiveMethods._get(key, Primitive.Symbol, def);
    }
}
