import { BuiltInConverters } from '../BuiltInConverters';
import { Validator } from '../Validators';
import { PrimitiveMethods } from './PrimitiveMethods';

import type { ArrayConverter, BuiltInConverter, ConverterFunction, ConditionalReturn } from '../Types';

/**
 * Mixin for advanced methods for environment variable conversion using built-in and custom converters
 * @internal
 */
export class AdvancedMethods extends PrimitiveMethods {
  /**
   * Get an environment variable using a built-in converter.
   * Supports both Converter enum values and array converter configurations.
   */
  static getUsing<ReturnType, Default extends ReturnType | undefined = undefined>(
    key: string,
    converter: BuiltInConverter | ArrayConverter,
    def?: Default
  ): ConditionalReturn<ReturnType, Default> {
    if (Validator.isArrayConverter(converter)) {
      return this.processArrayConverter(key, def, converter) as ConditionalReturn<ReturnType, Default>;
    }

    Validator.builtInConverter(converter);
    return this.processBuiltInConverter(key, def, converter) as ConditionalReturn<ReturnType, Default>;
  }

  /**
   * @see {@link AdvancedMethods.getUsing}
   */
  getUsing<ReturnType, Default extends ReturnType | undefined = undefined>(
    key: string,
    converter: BuiltInConverter | ArrayConverter,
    def?: Default
  ): ConditionalReturn<ReturnType, Default> {
    return AdvancedMethods.getUsing(key, converter, def);
  }

  /**
   * Get an environment variable using a custom converter function.
   */
  static getWith<ReturnType, Default extends ReturnType | undefined = undefined>(
    key: string,
    converter: ConverterFunction<ReturnType>,
    def?: Default
  ): ConditionalReturn<ReturnType, Default> {
    Validator.customConvertor(converter);

    const raw = this.get(key, undefined);
    if (raw === undefined) return def as ConditionalReturn<ReturnType, Default>;

    return converter(raw, def) as ConditionalReturn<ReturnType, Default>;
  }

  /**
   * @see {@link AdvancedMethods.getWith}
   */
  getWith<ReturnType, Default extends ReturnType | undefined = undefined>(
    key: string,
    converter: ConverterFunction<ReturnType>,
    def?: Default
  ): ConditionalReturn<ReturnType, Default> {
    return AdvancedMethods.getWith(key, converter, def);
  }

  private static processBuiltInConverter<ReturnType>(
    key: string,
    fallback: ReturnType | undefined,
    converter: BuiltInConverter
  ): ReturnType | undefined {
    const parsed = this.get(key, undefined);
    if (parsed === undefined) return fallback;

    const converterFn = BuiltInConverters.getConverter(converter);
    const result = converterFn(parsed, fallback);

    return result as ReturnType | undefined;
  }

  private static processArrayConverter<ReturnType>(
    key: string,
    fallback: ReturnType | undefined,
    converter: ArrayConverter
  ): ReturnType | undefined {
    Validator.arrayConverter(converter);

    const parsed = this.get(key, undefined);
    if (parsed === undefined) return fallback;

    const result = BuiltInConverters.processArrayConverter(parsed, fallback, converter);
    return result as ReturnType | undefined;
  }
}
