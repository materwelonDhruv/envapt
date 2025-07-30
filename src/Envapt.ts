/* eslint-disable security/detect-bidi-characters */
import { Envapter, EnvaptCache } from './Envapter';
import { Parser } from './Parser';

import type { EnvaptConverter, EnvaptOptions } from './Types';

function createPropertyDecorator<FallbackType>(
  key: string,
  fallback: FallbackType | undefined,
  converter: EnvaptConverter<FallbackType> | undefined,
  hasFallback = true
): PropertyDecorator {
  return function (target: object, prop: string | symbol): void {
    const propKey = String(prop);
    const cacheKey = `${target.constructor.name}.${propKey}`;

    // Create a property with a getter that handles environment changes
    Object.defineProperty(target, propKey, {
      get: function () {
        // Check if the environment cache has been cleared (indicating config change)
        // If so, we need to re-evaluate our cached value
        let value = EnvaptCache.get(cacheKey) as FallbackType | null | undefined;

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
 * Supports both modern options-based API and classic parameter-based API.
 * Automatically detects types from fallback values and provides caching for performance.
 *
 * Note: Using \@Envapt on a variable for an env that doesn't exist will set the value to `null` if no fallback is provided, regardless of a converter being used.
 *
 * @param key - Environment variable name to load
 * @param options - Configuration options (modern API)
 *
 * @example Modern API (recommended):
 * ```ts
 * class Config extends Envapter {
 * ‎ ‎ \@Envapt('PORT', { fallback: 3000 })
 * ‎ ‎ static readonly port: number;
 *
 * ‎ ‎ \@Envapt('FEATURES', { fallback: ['auth'], converter: 'array' })
 * ‎ ‎ declare private readonly features: string[];
 *
 * ‎ ‎ \@Envapt('CONFIG', { converter: 'json' })
 * ‎ ‎ static readonly config: object;
 *
 * ‎ ‎ \@Envapt('API_URL', { converter: 'url' })
 * ‎ ‎ declare public readonly apiUrl: URL;
 *
 * ‎ ‎ \@Envapt('CUSTOM_LIST', {
 * ‎ ‎ ‎ ‎ fallback: [1, 2, 3],
 * ‎ ‎ ‎ ‎ converter: {
 * ‎ ‎ ‎ ‎   delimiter: ',',
 * ‎ ‎ ‎ ‎   type: 'number' // Convert each item to number
 * ‎ ‎ ‎ ‎ }
 * ‎ ‎ })
 * ‎ ‎ static readonly customList: string[];
 * }
 * ```
 *
 * @param key - Environment variable name to load
 * @param fallback - Default value if variable is not found. Only suppoerts primitive types (string, number, boolean, bigint, symbol).
 * @param converter - Custom converter function or built-in converter
 *
 * @example Classic API
 * ```ts
 * class HealthCheck {
 * ‎ ‎ \@Envapt('PORT', 3000) declare readonly port: number;
 *
 * ‎ ‎ // code to start server
 * ‎ ‎ public start() {
 * ‎ ‎ ‎ ‎ // works on instance properties
 * ‎ ‎ ‎ ‎ console.log(`Server running on port ${this.port}`);
 * ‎ ‎ }
 * }
 * ```
 *
 * @public
 */
export function Envapt<FallbackType = unknown>(key: string, options?: EnvaptOptions<FallbackType>): PropertyDecorator;
export function Envapt<FallbackType = string | number | boolean | bigint | symbol>(
  key: string,
  fallback?: FallbackType,
  converter?: EnvaptConverter<FallbackType>
): PropertyDecorator;
export function Envapt<FallbackType = unknown>(
  key: string,
  fallbackOrOptions?: FallbackType | EnvaptOptions<FallbackType>,
  converter?: EnvaptConverter<FallbackType>
): PropertyDecorator {
  // Determine if using new options API or classic API
  let fallback: FallbackType | undefined;
  let actualConverter: EnvaptConverter<FallbackType> | undefined;
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
    fallback = fallbackOrOptions as FallbackType;
    actualConverter = converter;
    hasFallback = arguments.length > 1;
  }

  return createPropertyDecorator(key, fallback, actualConverter, hasFallback);
}
