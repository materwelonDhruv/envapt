import { EnvaptCache } from './core/EnvapterBase';
import { Envapter } from './Envapter';
import { Parser } from './Parser';

import type {
  ArrayConverter,
  BuiltInConverter,
  ConverterFunction,
  EnvaptConverter,
  EnvaptOptions,
  InferConverterReturnType,
  InferPrimitiveReturnType,
  PrimitiveConstructor
} from './Types';

function createPropertyDecorator<TFallback>(
  key: string,
  fallback: TFallback | undefined,
  converter: EnvaptConverter<TFallback> | undefined,
  hasFallback: boolean
): PropertyDecorator {
  return function (target: object, prop: string | symbol): void {
    const propKey = String(prop);
    const cacheKey = `${target.constructor.name}.${propKey}`;

    // Create a property with a getter that handles environment changes
    Object.defineProperty(target, propKey, {
      get: function () {
        // Check if the environment cache has been cleared (indicating config change)
        // If so, we need to re-evaluate our cached value
        let value = EnvaptCache.get(cacheKey) as TFallback | null | undefined;

        // Re-evaluate if we don't have a cached value
        if (value === undefined) {
          const parser = new Parser(new Envapter());
          value = parser.convertValue(key, fallback, converter, hasFallback);
          EnvaptCache.set(cacheKey, value);
        }

        return value;
      },
      configurable: false,
      enumerable: true
    });
  };
}

/**
 * Instance/Static Property decorator that automatically loads and converts environment variables.
 *
 * Supports multiple overloads for optimal type inference based on converter type.
 * Automatically detects types from fallback values and provides caching for performance.
 *
 * @param key - Environment variable name to load
 * @param options - Configuration options with built-in converter
 * @public
 */
export function Envapt<TConverter extends BuiltInConverter>(
  key: string,
  options: { converter: TConverter; fallback?: InferConverterReturnType<TConverter> }
): PropertyDecorator;

/**
 * @param key - Environment variable name to load
 * @param options - Configuration options with array converter
 * @public
 */
export function Envapt<TConverter extends ArrayConverter>(
  key: string,
  options: { converter: TConverter; fallback?: InferConverterReturnType<TConverter> }
): PropertyDecorator;

/**
 * @param key - Environment variable name to load
 * @param options - Configuration options with primitive constructor
 * @public
 */
export function Envapt<TConstructor extends PrimitiveConstructor>(
  key: string,
  options: {
    converter: TConstructor;
    fallback?: InferPrimitiveReturnType<TConstructor>;
  }
): PropertyDecorator;

/**
 * @param key - Environment variable name to load
 * @param options - Configuration options with custom converter
 * @public
 */
export function Envapt<TReturnType>(
  key: string,
  options: { converter: ConverterFunction<TReturnType>; fallback?: TReturnType }
): PropertyDecorator;

/**
 * @param key - Environment variable name to load
 * @param options - Configuration options with fallback only
 * @public
 */
export function Envapt<TFallback>(key: string, options: { fallback: TFallback }): PropertyDecorator;

/**
 * @param key - Environment variable name to load
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function Envapt<_TReturnType = string | null>(key: string): PropertyDecorator;

/**
 * Classic API: Built-in converter with fallback
 * @param key - Environment variable name to load
 * @param fallback - Default value with built-in converter
 * @param converter - Built-in converter
 * @public
 */
export function Envapt<TConverter extends BuiltInConverter>(
  key: string,
  fallback: InferConverterReturnType<TConverter>,
  converter: TConverter
): PropertyDecorator;

/**
 * Classic API: Array converter with fallback
 * @param key - Environment variable name to load
 * @param fallback - Default array value
 * @param converter - Array converter
 * @public
 */
export function Envapt<TConverter extends ArrayConverter>(
  key: string,
  fallback: InferConverterReturnType<TConverter>,
  converter: TConverter
): PropertyDecorator;

/**
 * Classic API: Primitive constructor with fallback
 * @param key - Environment variable name to load
 * @param fallback - Default value
 * @param converter - Primitive constructor (String, Number, Boolean, BigInt, Symbol)
 * @public
 */
export function Envapt<TConstructor extends PrimitiveConstructor>(
  key: string,
  fallback: InferPrimitiveReturnType<TConstructor>,
  converter: TConstructor
): PropertyDecorator;

/**
 * Classic API: Custom converter with fallback
 * @param key - Environment variable name to load
 * @param fallback - Default value
 * @param converter - Custom converter function
 * @public
 */
export function Envapt<TReturnType>(
  key: string,
  fallback: TReturnType,
  converter: ConverterFunction<TReturnType>
): PropertyDecorator;

/**
 * Classic API: Primitive fallback only
 * @param key - Environment variable name to load
 * @param fallback - Default primitive value
 * @param converter - Optional primitive constructor (String, Number, etc.)
 * @public
 */
export function Envapt<TFallback extends string | number | boolean | bigint | symbol | undefined>(
  key: string,
  fallback: TFallback,
  converter?: PrimitiveConstructor
): PropertyDecorator;

// Implementation
export function Envapt<TFallback = unknown>(
  key: string,
  fallbackOrOptions?: TFallback | EnvaptOptions<TFallback>,
  converter?: EnvaptConverter<TFallback>
): PropertyDecorator {
  // Determine if using new options API or classic API
  let fallback: TFallback | undefined;
  let actualConverter: EnvaptConverter<TFallback> | undefined;
  let hasFallback = true;

  if (
    fallbackOrOptions &&
    typeof fallbackOrOptions === 'object' &&
    ('fallback' in fallbackOrOptions || 'converter' in fallbackOrOptions)
  ) {
    // Modern API
    const options = fallbackOrOptions;
    fallback = options.fallback;
    actualConverter = options.converter;
    hasFallback = 'fallback' in options;
  } else {
    // Classic API
    fallback = fallbackOrOptions as TFallback;
    actualConverter = converter;
    hasFallback = arguments.length > 1;
  }

  return createPropertyDecorator(key, fallback, actualConverter, hasFallback);
}
