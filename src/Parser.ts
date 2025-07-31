import { BuiltInConverters } from './BuiltInConverters';
import { EnvaptError, EnvaptErrorCodes } from './Error';
import { Validator } from './Validators';

import type { EnvaptConverter, PrimitiveConstructor, ArrayConverter, BuiltInConverter } from './Types';

/**
 * @internal
 */
export interface EnvapterService {
  getRaw(key: string): string | undefined;
  get(key: string, def?: string): string | undefined;
  getNumber(key: string, def?: number): number | undefined;
  getBoolean(key: string, def?: boolean): boolean | undefined;
}

/**
 * Parser class for handling environment variable template resolution and type conversion
 * @internal
 */
export class Parser {
  private readonly TEMPLATE_REGEX = /\${\w*}/g;

  constructor(private readonly envService: EnvapterService) {}

  /**
   * Resolve template variables in a string while handling circular references and missing variables
   * @internal
   */
  resolveTemplate(key: string, value: string, stack = new Set<string>()): string {
    if (stack.has(key)) return value; // direct cycle, keep as is

    stack.add(key);

    const out = value.replace(this.TEMPLATE_REGEX, (template) => {
      const variable = template.slice(2, -1);
      if (!variable) return template; // empty name, preserve

      if (stack.has(variable)) return template; // cycle, preserve

      const raw = this.envService.getRaw(variable);
      if (!raw || raw === '') return template; // missing or empty, preserve

      const resolved = this.resolveTemplate(variable, raw, new Set(stack));

      // If resolution still references the current key, skip replacement (indirect cycle)
      if (resolved.includes(`\${${key}}`)) return template;

      // If nothing changed (unresolved placeholders stayed), also preserve original template
      if (resolved === raw && /\$\{[^}]*\}/.test(resolved)) return template;

      return resolved;
    });

    stack.delete(key);
    return out;
  }

  convertValue<TFallback>(
    key: string,
    fallback: TFallback | undefined,
    converter: EnvaptConverter<TFallback> | undefined,
    hasFallback = true
  ): TFallback | null | undefined {
    const resolvedConverter = this.resolveConverter(converter, fallback);
    const processedFallback = this.processFallbackForConverter(resolvedConverter, fallback);

    // Handle different converter types
    if (Validator.isArrayConverter(resolvedConverter)) {
      return this.processArrayConverter(key, processedFallback, resolvedConverter, hasFallback);
    }

    if (Validator.isPrimitiveConstructor(resolvedConverter)) {
      const stringConverter = this.convertPrimitiveToString(resolvedConverter);
      return this.processBuiltInConverter(key, processedFallback, stringConverter, hasFallback, true);
    }

    if (Validator.isBuiltInConverter(resolvedConverter)) {
      return this.processBuiltInConverter(key, processedFallback, resolvedConverter, hasFallback, false);
    }

    return this.processCustomConverter(key, processedFallback, resolvedConverter, hasFallback);
  }

  private processFallbackForConverter<TFallback>(
    converter: EnvaptConverter<TFallback>,
    fallback: TFallback | undefined
  ): TFallback | undefined {
    // For primitive constructors, coerce the fallback to match the converter
    if (Validator.isPrimitiveConstructor(converter) && fallback !== undefined) {
      return Validator.coercePrimitiveFallback<TFallback>(converter, fallback);
    }
    return fallback;
  }

  private convertPrimitiveToString(primitiveConstructor: PrimitiveConstructor): BuiltInConverter {
    if (primitiveConstructor === String) return 'string';
    if (primitiveConstructor === Number) return 'number';
    if (primitiveConstructor === Boolean) return 'boolean';
    if (primitiveConstructor === BigInt) return 'bigint';
    if (primitiveConstructor === Symbol) return 'symbol';

    throw new EnvaptError(EnvaptErrorCodes.InvalidConverterType, `Unknown primitive constructor`);
  }

  private processBuiltInConverter<TFallback>(
    key: string,
    fallback: TFallback | undefined,
    resolvedConverter: BuiltInConverter,
    hasFallback: boolean,
    wasOriginallyConstructor: boolean
  ): TFallback | null | undefined {
    // Validate the built-in converter at runtime
    Validator.builtInConverter(resolvedConverter);

    // Validate fallback type matches converter for built-in converters
    // Only apply strict validation if this wasn't originally a constructor
    if (hasFallback && fallback !== undefined && !wasOriginallyConstructor) {
      Validator.validateBuiltInConverterFallback(resolvedConverter, fallback);

      // Special handling for 'array' converter - check array element consistency
      if (resolvedConverter === 'array' && Array.isArray(fallback)) {
        Validator.validateArrayFallbackElementTypes(fallback);
      }
    }

    const parsed = this.envService.get(key, undefined);

    if (parsed === undefined) return hasFallback ? fallback : null;

    const converterFn = BuiltInConverters.getConverter(resolvedConverter);
    const result = converterFn(parsed, fallback);

    // If converter failed (returned undefined) and no fallback was provided, return null
    if (result === undefined && !hasFallback) return null;

    return result as TFallback;
  }

  private processArrayConverter<TFallback>(
    key: string,
    fallback: TFallback | undefined,
    resolvedConverter: ArrayConverter,
    hasFallback: boolean
  ): TFallback | null | undefined {
    // Validate the resolvedConverter at runtime and assert that it is indeed an ArrayConverter
    Validator.arrayConverter(resolvedConverter);

    // Validate fallback type if a fallback is provided
    if (hasFallback && fallback !== undefined && !Array.isArray(fallback)) {
      throw new EnvaptError(
        EnvaptErrorCodes.InvalidFallback,
        `ArrayConverter requires that the fallback be an array, got ${typeof fallback}`
      );
    }

    // Additional validations for array converter fallbacks
    if (hasFallback && Array.isArray(fallback)) {
      // Validate that all elements in fallback array have consistent types
      Validator.validateArrayFallbackElementTypes(fallback);

      // For array converters with a type, validate that converter type matches fallback elements
      if (resolvedConverter.type) {
        Validator.validateArrayConverterElementTypeMatch(resolvedConverter.type, fallback);
      }
    }

    const parsed = this.envService.get(key, undefined);

    if (parsed === undefined) return hasFallback ? fallback : null;

    const result = BuiltInConverters.processArrayConverter(parsed, fallback, resolvedConverter);

    // If converter failed (returned undefined) and no fallback was provided, return null
    if (result === undefined && !hasFallback) return null;

    return result as TFallback;
  }

  private processCustomConverter<TFallback>(
    key: string,
    fallback: TFallback | undefined,
    resolvedConverter: EnvaptConverter<TFallback>,
    hasFallback: boolean
  ): TFallback | null | undefined {
    Validator.customConvertor(resolvedConverter);

    // Custom converter function
    const raw = this.envService.get(key, undefined);

    // If no fallback provided and no value found, return null
    // If explicit undefined fallback and no value found, return undefined

    if (raw === undefined) return hasFallback ? fallback : null;

    return resolvedConverter(raw, fallback);
  }

  private resolveConverter<TFallback>(
    converter: EnvaptConverter<TFallback> | undefined,
    fallback: TFallback | undefined
  ): EnvaptConverter<TFallback> {
    // User provided explicit converter. Use it
    if (converter) return converter;

    // Auto-detect type from fallback using typeof
    const fallbackType = typeof fallback;
    if (fallbackType === 'number') return 'number';
    if (fallbackType === 'boolean') return 'boolean';
    if (fallbackType === 'bigint') return 'bigint';
    if (fallbackType === 'symbol') return 'symbol';
    return 'string';
  }
}
