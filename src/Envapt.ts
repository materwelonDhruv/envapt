import { EnvaptCache } from './core/EnvapterBase.ts';
import { Envapter } from './Envapter.ts';
import { Parser } from './Parser.ts';

import type {
  ArrayConverter,
  BuiltInConverter,
  ConverterFunction,
  EnvaptConverter,
  EnvaptOptions,
  InferConverterReturnType,
  InferPrimitiveFallbackType,
  InferPrimitiveReturnType,
  PrimitiveConstructor
} from './Types.ts';

function createPropertyDecorator<TFallback>(
  key: string,
  fallback: TFallback | undefined,
  converter: EnvaptConverter<TFallback> | undefined,
  hasFallback: boolean
): PropertyDecorator {
  return function (target: object, prop: string | symbol): void {
    const propKey = String(prop);
    // For static properties, target is the constructor function itself
    // For instance properties, target is the prototype and we need target.constructor
    // This prevents cache collisions between static and instance properties with the same name
    const className = typeof target === 'function' ? target.name : target.constructor.name;
    const cacheKey = `${className}.${propKey}`;

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
 * Usage 1: Custom converter function with fallback provided
 *
 * @param key - Environment variable name to load
 * @param options - Configuration options with custom converter and required fallback
 * @public
 */
export function Envapt<TFallback>(
  key: string,
  options: { converter: (raw: string | undefined, fallback: TFallback) => TFallback; fallback: TFallback }
): PropertyDecorator;

/**
 * Usage 2: Custom converter function without fallback
 *
 * @param key - Environment variable name to load
 * @param options - Configuration options with custom converter only
 * @public
 */
export function Envapt<TReturnType>(
  key: string,
  options: { converter: ConverterFunction<TReturnType> }
): PropertyDecorator;

/**
 * Usage 3: Built-in converter with optional fallback
 *
 * @param key - Environment variable name to load
 * @param options - Configuration options with built-in converter
 * @public
 */
export function Envapt<TConverter extends BuiltInConverter>(
  key: string,
  options: { converter: TConverter; fallback?: InferConverterReturnType<TConverter> | undefined }
): PropertyDecorator;

/**
 * Usage 4: Array converter with optional fallback
 *
 * @param key - Environment variable name to load
 * @param options - Configuration options with array converter
 * @public
 */
export function Envapt<TConverter extends ArrayConverter>(
  key: string,
  options: { converter: TConverter; fallback?: InferConverterReturnType<TConverter> | undefined }
): PropertyDecorator;

/**
 * Usage 5: Primitive constructor with optional fallback
 *
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
 * Usage 6: Fallback only (no converter)
 *
 * @param key - Environment variable name to load
 * @param options - Configuration options with fallback only
 * @public
 */
export function Envapt<TFallback>(
  key: string,
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  options: { fallback: TFallback; converter?: undefined }
): PropertyDecorator;

/**
 * Classic API: No fallback
 *
 * @param key - Environment variable name to load
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function Envapt<_TReturnType = string | null>(key: string): PropertyDecorator;

/**
 * Classic API: Primitive fallback only
 *
 * @param key - Environment variable name to load
 * @param fallback - Default primitive value
 * @param converter - Optional primitive constructor (String, Number, etc.)
 * @public
 */
export function Envapt<TFallback extends string | number | boolean | bigint | symbol | undefined>(
  key: string,
  fallback: InferPrimitiveFallbackType<TFallback>,
  converter?: PrimitiveConstructor
): PropertyDecorator;

/**
 * Instance/Static Property decorator that automatically loads and converts environment variables.
 */
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
