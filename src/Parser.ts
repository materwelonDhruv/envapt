import { BuiltInConverters } from './BuiltInConverters';
import { EnvaptError, EnvaptErrorCodes } from './Error';
import { Validator } from './Validators';

import type { EnvaptConverter } from './Types';

/**
 * @internal
 */
export interface EnvapterService {
  getRaw(key: string): string | undefined;
  get(key: string, def?: string): string;
  getNumber(key: string, def?: number): number;
  getBoolean(key: string, def?: boolean): boolean;
}

/**
 * Parser class for handling environment variable template resolution and type conversion
 * @internal
 */
export class Parser {
  private readonly TEMPLATE_REGEX = /\${\w*}/g;

  constructor(private readonly envService: EnvapterService) {}

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

  private processBuiltInConverter<FallbackType>(
    key: string,
    fallback: FallbackType | undefined,
    resolvedConverter: EnvaptConverter<FallbackType>,
    hasFallback: boolean,
    wasOriginallyConstructor = false
  ): FallbackType | null | undefined {
    // Validate the built-in converter at runtime
    Validator.builtInConverter(resolvedConverter);

    // Validate fallback type matches converter for built-in converters
    // Only apply strict validation if this wasn't originally a constructor
    if (hasFallback && fallback !== undefined && !wasOriginallyConstructor) {
      Validator.validateBuiltInConverterFallback(resolvedConverter, fallback);

      // Special handling for 'array' converter. also check array element consistency
      if (resolvedConverter === 'array' && Array.isArray(fallback)) {
        Validator.validateArrayFallbackElementTypes(fallback);
      }
    }

    const parsed = this.envService.get(key, undefined);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (parsed === undefined) return hasFallback ? fallback : null;

    const converterFn = BuiltInConverters.getConverter(resolvedConverter);
    const result = converterFn(parsed, fallback);

    // If converter failed (returned undefined) and no fallback was provided, return null
    if (result === undefined && !hasFallback) return null;

    return result as FallbackType;
  }

  private processArrayConverter<FallbackType>(
    key: string,
    fallback: FallbackType | undefined,
    resolvedConverter: EnvaptConverter<FallbackType>,
    hasFallback: boolean
  ): FallbackType | null | undefined {
    // Validate the ArrayConverter configuration at runtime
    Validator.arrayConverter(resolvedConverter);

    // Validate fallback type if a fallback is provided
    if (hasFallback && fallback !== undefined && !Array.isArray(fallback)) {
      throw new EnvaptError(
        EnvaptErrorCodes.InvalidFallback,
        `ArrayConverter requires that the fallback be an array, got ${typeof fallback}`
      );
    }

    // Additional validations for array converter fallbacks
    if (Array.isArray(fallback)) {
      // Validate that all elements in fallback array have consistent types
      Validator.validateArrayFallbackElementTypes(fallback);

      // Validate that array converter type matches fallback element type
      if (resolvedConverter.type) {
        Validator.validateArrayConverterFallbackMatch(resolvedConverter.type, fallback);
      }
    }

    const parsed = this.envService.get(key, undefined);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (parsed === undefined) return hasFallback ? fallback : null;

    const result = BuiltInConverters.processArrayConverter(parsed, fallback, resolvedConverter);

    // If converter failed (returned undefined) and no fallback was provided, return null
    if (result === undefined && !hasFallback) return null;

    return result as FallbackType;
  }

  convertValue<FallbackType>(
    key: string,
    fallback: FallbackType | undefined,
    converter: EnvaptConverter<FallbackType> | undefined,
    hasFallback = true
  ): FallbackType | null | undefined {
    // Determine which converter to use
    let resolvedConverter = this.resolveConverter(converter, fallback);

    // Track if this was originally a constructor to avoid strict validation
    const wasOriginallyConstructor =
      resolvedConverter === Number ||
      resolvedConverter === Boolean ||
      resolvedConverter === String ||
      resolvedConverter === BigInt ||
      resolvedConverter === Symbol;

    if (resolvedConverter === Number) resolvedConverter = 'number';
    else if (resolvedConverter === Boolean) resolvedConverter = 'boolean';
    else if (resolvedConverter === String) resolvedConverter = 'string';
    else if (resolvedConverter === BigInt) resolvedConverter = 'bigint';
    else if (resolvedConverter === Symbol) resolvedConverter = 'symbol';

    // Check if it's an ArrayConverter object
    if (Validator.isArrayConverter(resolvedConverter)) {
      return this.processArrayConverter(key, fallback, resolvedConverter, hasFallback);
    }

    // Check if it's a built-in converter
    if (Validator.isBuiltInConverter(resolvedConverter as EnvaptConverter<unknown>)) {
      return this.processBuiltInConverter(key, fallback, resolvedConverter, hasFallback, wasOriginallyConstructor);
    }

    Validator.customConvertor(resolvedConverter);

    // Custom converter function
    const raw = this.envService.get(key, undefined);

    // If no fallback provided and no value found, return null
    // If explicit undefined fallback and no value found, return undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (raw === undefined) return hasFallback ? fallback : null;

    return resolvedConverter(raw, fallback);
  }

  private resolveConverter<FallbackType>(
    converter: EnvaptConverter<FallbackType> | undefined,
    fallback: FallbackType | undefined
  ): EnvaptConverter<FallbackType> {
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
