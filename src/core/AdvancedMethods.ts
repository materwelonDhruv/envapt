import { PrimitiveMethods } from './PrimitiveMethods.js';

import type {
  AdvancedConverterReturn,
  ArrayConverter,
  BuiltInConverter,
  ConditionalReturn,
  ConverterFunction
} from '../Types.js';

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
    key: string,
    converter: TConverter,
    fallback?: TFallback
  ): AdvancedConverterReturn<TConverter, TFallback>;
  static getUsing<TReturn>(key: string, converter: BuiltInConverter | ArrayConverter, fallback?: TReturn): TReturn;
  static getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
    key: string,
    converter: TConverter,
    fallback?: TFallback
  ): AdvancedConverterReturn<TConverter, TFallback> {
    // Check if variable exists first, for consistency with primitive methods
    const rawVal = this.config.get(key);
    if (!rawVal) return fallback as AdvancedConverterReturn<TConverter, TFallback>;

    const hasFallback = fallback !== undefined;
    const result = this.parser.convertValue(key, fallback, converter, hasFallback);

    return result as AdvancedConverterReturn<TConverter, TFallback>;
  }

  /**
   * @see {@link AdvancedMethods.getUsing}
   */
  getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
    key: string,
    converter: TConverter,
    fallback?: TFallback
  ): AdvancedConverterReturn<TConverter, TFallback>;
  getUsing<TReturn>(key: string, converter: BuiltInConverter | ArrayConverter, fallback?: TReturn): TReturn;
  getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
    key: string,
    converter: TConverter,
    fallback?: TFallback
  ): AdvancedConverterReturn<TConverter, TFallback> {
    return AdvancedMethods.getUsing(key, converter, fallback);
  }

  /**
   * Get an environment variable using a custom converter function.
   */
  static getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
    key: string,
    converter: ConverterFunction<TReturnType>,
    fallback?: TFallback
  ): ConditionalReturn<TReturnType, TFallback> {
    // Check if variable exists first, for consistency with primitive methods
    const rawVal = this.config.get(key);
    if (!rawVal) return fallback as ConditionalReturn<TReturnType, TFallback>;

    const hasFallback = fallback !== undefined;
    // Convert the converter to match the expected signature via unknown
    const result = this.parser.convertValue(
      key,
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
    key: string,
    converter: ConverterFunction<TReturnType>,
    fallback?: TFallback
  ): ConditionalReturn<TReturnType, TFallback> {
    return AdvancedMethods.getWith(key, converter, fallback);
  }
}
