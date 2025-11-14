import { PrimitiveMethods } from './PrimitiveMethods';

import type {
  AdvancedConverterReturn,
  ArrayConverter,
  BuiltInConverter,
  ConditionalReturn,
  ConverterFunction
} from '../Types';

/**
 * Mixin for advanced methods for environment variable conversion using built-in and custom converters
 * @internal
 */
export class AdvancedMethods extends PrimitiveMethods {
  /**
   * Get an environment variable using a built-in converter.
   * Supports both Converter enum values and array converter configurations.
   *
   * `key` can be:
   * - a single env var name: "DISCORD_TOKEN"
   * - or an array of env var names: ["DISCORD_TOKEN", "DISCORD_BOT_TOKEN", "BOT_TOKEN"]
   *   In this case, the first non-empty value wins.
   */
  static getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
    key: string | string[],
    converter: TConverter,
    fallback?: TFallback
  ): AdvancedConverterReturn<TConverter, TFallback>;
  static getUsing<TReturn>(
    key: string | string[],
    converter: BuiltInConverter | ArrayConverter,
    fallback?: TReturn
  ): TReturn;
  static getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
    key: string | string[],
    converter: TConverter,
    fallback?: TFallback
  ): AdvancedConverterReturn<TConverter, TFallback> {
    const keys = Array.isArray(key) ? key : [key];
    let activeKey: string | undefined;
    let rawVal: unknown;

    // Look for the first non-empty value among the provided keys
    for (const k of keys) {
      const candidate = this.config.get(k);
      if (candidate !== undefined && candidate !== null && candidate !== '') {
        activeKey = k;
        rawVal = candidate;
        break;
      }
    }

    // If nothing is set, behave like before: return the fallback
    if (!rawVal) return fallback as AdvancedConverterReturn<TConverter, TFallback>;

    const hasFallback = fallback !== undefined;
    // Use the resolved key (the one that actually had a value) for template resolution & error messages
    const result = this.parser.convertValue(
      activeKey as string,
      fallback,
      converter,
      hasFallback
    );

    return result as AdvancedConverterReturn<TConverter, TFallback>;
  }

  /**
   * @see {@link AdvancedMethods.getUsing}
   */
  getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
    key: string | string[],
    converter: TConverter,
    fallback?: TFallback
  ): AdvancedConverterReturn<TConverter, TFallback>;
  getUsing<TReturn>(
    key: string | string[],
    converter: BuiltInConverter | ArrayConverter,
    fallback?: TReturn
  ): TReturn;
  getUsing<TConverter extends BuiltInConverter | ArrayConverter, TFallback = undefined>(
    key: string | string[],
    converter: TConverter,
    fallback?: TFallback
  ): AdvancedConverterReturn<TConverter, TFallback> {
    return AdvancedMethods.getUsing(key, converter, fallback);
  }

  /**
   * Get an environment variable using a custom converter function.
   *
   * `key` can be a single env var name or an array of names.
   * The first non-empty value among the provided keys is used.
   */
  static getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
    key: string | string[],
    converter: ConverterFunction<TReturnType>,
    fallback?: TFallback
  ): ConditionalReturn<TReturnType, TFallback> {
    const keys = Array.isArray(key) ? key : [key];
    let activeKey: string | undefined;
    let rawVal: unknown;

    for (const k of keys) {
      const candidate = this.config.get(k);
      if (candidate !== undefined && candidate !== null && candidate !== '') {
        activeKey = k;
        rawVal = candidate;
        break;
      }
    }

    if (!rawVal) return fallback as ConditionalReturn<TReturnType, TFallback>;

    const hasFallback = fallback !== undefined;
    const result = this.parser.convertValue(
      activeKey as string,
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
    key: string | string[],
    converter: ConverterFunction<TReturnType>,
    fallback?: TFallback
  ): ConditionalReturn<TReturnType, TFallback> {
    return AdvancedMethods.getWith(key, converter, fallback);
  }
}
