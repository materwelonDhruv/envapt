import { PrimitiveMethods } from './PrimitiveMethods';

import type {
    AdvancedConverterReturn,
    ArrayConverter,
    BuiltInConverter,
    ConditionalReturn,
    ConverterFunction,
    EnvKeyInput
} from '../Types';

/**
 * Mixin for advanced methods for environment variable conversion using built-in and custom converters
 * @internal
 */
export class AdvancedMethods extends PrimitiveMethods {
    /**
     * Get an environment variable using a built-in converter.
     * Supports both Converter enum values and array converter configurations.
     */
    static getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback>;
    static getUsing<TReturn>(
        key: EnvKeyInput,
        converter: BuiltInConverter | ArrayConverter,
        fallback?: TReturn
    ): TReturn;
    static getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback> {
        // Check if variable exists first, for consistency with primitive methods
        const { key: resolvedKey, value } = this.resolveKeyInput(key);
        if (!value) return fallback as AdvancedConverterReturn<TConverter, TFallback>;

        const hasFallback = fallback !== undefined;
        const result = this.parser.convertValue(resolvedKey, fallback, converter, hasFallback);

        return result as AdvancedConverterReturn<TConverter, TFallback>;
    }

    /**
     * @see {@link AdvancedMethods.getUsing}
     */
    getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback>;
    getUsing<TReturn>(key: EnvKeyInput, converter: BuiltInConverter | ArrayConverter, fallback?: TReturn): TReturn;
    getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback> {
        return AdvancedMethods.getUsing(key, converter, fallback);
    }

    /**
     * Get an environment variable using a custom converter function.
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
