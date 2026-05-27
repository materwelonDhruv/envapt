import { PrimitiveMethods } from './PrimitiveMethods';

import type { ArrayOf } from '../Converters';
import type {
    AdvancedConverterReturn,
    BuiltInConverter,
    ConditionalReturn,
    ConverterFunction,
    EnvKeyInput,
    TimeFallback
} from '../Types';

/**
 * Mixin for advanced methods for environment variable conversion using built-in and custom converters
 * @internal
 */
export class AdvancedMethods extends PrimitiveMethods {
    /**
     * Get an environment variable using a built-in converter.
     *
     * Supports both scalar tokens (e.g. `Converters.Number`) and `ArrayOf<...>` tokens
     * produced by `Converters.array(...)`. The key can be a single name or an ordered list;
     * the first defined value wins.
     */
    // Time-specific overload — constrains the fallback to TimeFallback (number | time-string).
    // Must precede the generic BuiltInConverter overload so it wins overload resolution.
    static getUsing<TFallback extends TimeFallback | undefined = undefined>(
        key: EnvKeyInput,
        converter: 'time',
        fallback?: TFallback
    ): ConditionalReturn<number, TFallback>;
    static getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback>;
    static getUsing<TReturn>(key: EnvKeyInput, converter: BuiltInConverter | ArrayOf, fallback?: TReturn): TReturn;
    static getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback> {
        const { key: resolvedKey, value } = this.resolveKeyInput(key);

        // No env value AND no fallback: return undefined to match primitive-method semantics.
        // Otherwise route through the parser so asymmetric fallback types (TimeFallback,
        // TimeFallback[] for `of: time` arrays) get coerced to the declared return type.
        if (!value && fallback === undefined) {
            return undefined as AdvancedConverterReturn<TConverter, TFallback>;
        }

        const hasFallback = fallback !== undefined;
        const result = this.parser.convertValue(resolvedKey, fallback, converter, hasFallback);

        return result as AdvancedConverterReturn<TConverter, TFallback>;
    }

    /**
     * @see {@link AdvancedMethods.getUsing}
     */
    getUsing<TFallback extends TimeFallback | undefined = undefined>(
        key: EnvKeyInput,
        converter: 'time',
        fallback?: TFallback
    ): ConditionalReturn<number, TFallback>;
    getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback>;
    getUsing<TReturn>(key: EnvKeyInput, converter: BuiltInConverter | ArrayOf, fallback?: TReturn): TReturn;
    getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback> {
        return AdvancedMethods.getUsing(key, converter, fallback);
    }

    /**
     * Get an environment variable using a custom converter function.
     * Accepts a single key or an ordered list for automatic fallback.
     */
    static getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback> {
        // Check if variable exists first, for consistency with primitive methods
        const { key: resolvedKey, value } = this.resolveKeyInput(key);
        if (!value) return fallback as ConditionalReturn<TReturnType, TFallback>;

        const hasFallback = fallback !== undefined;
        // Convert the converter to match the expected signature via unknown
        const result = this.parser.convertValue(
            resolvedKey,
            fallback,
            converter as unknown as ConverterFunction<TFallback>,
            hasFallback
        );

        return result as ConditionalReturn<TReturnType, TFallback>;
    }

    /**
     * @see {@link AdvancedMethods.getWith}
     */
    getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback> {
        return AdvancedMethods.getWith(key, converter, fallback);
    }
}
