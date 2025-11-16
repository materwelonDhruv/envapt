import { EnvaptCache } from './core/EnvapterBase';
import { Envapter } from './Envapter';
import { Parser } from './Parser';

import type {
    ArrayConverter,
    BuiltInConverter,
    ConverterFunction,
    EnvKeyInput,
    EnvaptConverter,
    EnvaptOptions,
    InferConverterReturnType,
    InferPrimitiveFallbackType,
    InferPrimitiveReturnType,
    PrimitiveConstructor
} from './Types';

function createPropertyDecorator<TFallback>(
    key: EnvKeyInput,
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
 * @param key - Environment variable name to load (string or ordered array of strings)
 * @param options - Configuration options with custom converter and required fallback
 * @public
 * @example
 * ```ts
 * // Custom converter that validates a non-empty API key
 * class Config extends Envapter {
 *   \@Envapt('API_KEY', {
 *     fallback: 'default-key',
 *     converter(raw, _fallback) {
 *       if (!raw || raw.trim() === '') throw new Error('API_KEY required');
 *       return raw.trim();
 *     }
 *   })
 *   static readonly apiKey: string;
 * }
 * ```
 */
export function Envapt<TFallback>(
    key: EnvKeyInput,
    options: { converter: (raw: string | undefined, fallback: TFallback) => TFallback; fallback: TFallback }
): PropertyDecorator;

/**
 * Usage 2: Custom converter function without fallback
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options with custom converter only
 * @public
 * @example
 * ```ts
 * // Custom converter without providing a fallback
 * class Config extends Envapter {
 *   \@Envapt('FEATURE_FLAGS', { converter(raw) {
 *     // raw may be undefined — handle that here
 *     return raw ? raw.split('|').map(s => s.trim()) : [];
 *   } })
 *   static readonly featureFlags: string[];
 * }
 * ```
 */
export function Envapt<TReturnType>(
    key: EnvKeyInput,
    options: { converter: ConverterFunction<TReturnType> }
): PropertyDecorator;

/**
 * Usage 3: Built-in converter with optional fallback
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options with built-in converter
 * @public
 * @example
 * ```ts
 * import { Converters } from 'envapt';
 *
 * class Config extends Envapter {
 *   // Use built-in Number converter with a numeric fallback
 *   \@Envapt('APP_PORT', { converter: Converters.Number, fallback: 3000 })
 *   static readonly port: number;
 *
 *   // Use Url converter with a string fallback (must match converter type)
 *   \@Envapt('APP_URL', { converter: Converters.Url, fallback: 'http://localhost:3000' })
 *   static readonly url: URL;
 *
 *   // Prefer CANARY_URL when present, otherwise fall back to APP_URL
 *   \@Envapt(['CANARY_URL', 'APP_URL'], { converter: Converters.Url })
 *   static readonly canaryUrl: URL | null;
 * }
 * ```
 */
export function Envapt<TConverter extends BuiltInConverter>(
    key: EnvKeyInput,
    options: { converter: TConverter; fallback?: InferConverterReturnType<TConverter> | undefined }
): PropertyDecorator;

/**
 * Usage 4: Array converter with optional fallback
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options with array converter
 * @public
 * @example
 * ```ts
 * import { Converters } from 'envapt';
 *
 * class Config extends Envapter {
 *   // Comma-separated list of origins -> string[]
 *   \@Envapt('ALLOWED_ORIGINS', {
 *     converter: { delimiter: ',', type: Converters.String },
 *     fallback: ['https://example.com']
 *   })
 *   static readonly allowedOrigins: string[];
 *
 *   // Pipe-separated ports -> number[]
 *   \@Envapt('PORTS', {
 *     converter: { delimiter: '|', type: Converters.Number },
 *     fallback: [3000]
 *   })
 *   static readonly ports: number[];
 * }
 * ```
 */
export function Envapt<TConverter extends ArrayConverter>(
    key: EnvKeyInput,
    options: { converter: TConverter; fallback?: InferConverterReturnType<TConverter> | undefined }
): PropertyDecorator;

/**
 * Usage 5: Primitive constructor with optional fallback
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options with primitive constructor
 * @public
 * @example
 * ```ts
 * // Use primitive constructors to coerce values
 * class Config extends Envapter {
 *   \@Envapt('MAX_CONNECTIONS', { converter: Number, fallback: 100 })
 *   static readonly maxConnections: number;
 *
 *   \@Envapt('FEATURE_ENABLED', { converter: Boolean, fallback: false })
 *   static readonly featureEnabled: boolean;
 * }
 * ```
 */
export function Envapt<TConstructor extends PrimitiveConstructor>(
    key: EnvKeyInput,
    options: {
        converter: TConstructor;
        fallback?: InferPrimitiveReturnType<TConstructor>;
    }
): PropertyDecorator;

/**
 * Usage 6: Fallback only (no converter)
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options with fallback only
 * @public
 * @example
 * ```ts
 * // Fallback-only usage (no converter)
 * class Config extends Envapter {
 *   \@Envapt('LOG_FILE', { fallback: '/var/log/app.log' })
 *   static readonly logFile: string;
 *
 *   \@Envapt('RETRY_POLICY', { fallback: { retries: 3, backoff: 'exponential' } })
 *   static readonly retryPolicy: unknown;
 * }
 * ```
 */
export function Envapt<TFallback>(
    key: EnvKeyInput,
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    options: { fallback: TFallback; converter?: undefined }
): PropertyDecorator;

/**
 * Classic API: No fallback
 *
 * @param key - Environment variable name(s) to load
 * @example
 * ```ts
 * // Classic API: no fallback — property will resolve from env or be null
 * class Config extends Envapter {
 *   \@Envapt('SIMPLE_VALUE')
 *   static readonly simple?: string | null;
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function Envapt<_TReturnType = string | null>(key: EnvKeyInput): PropertyDecorator;

/**
 * Classic API: Primitive fallback only
 *
 * @param key - Environment variable name(s) to load
 * @param fallback - Default primitive value
 * @param converter - Optional primitive constructor (String, Number, etc.)
 * @public
 * @example
 * ```ts
 * // Classic API with primitive fallback and optional primitive converter
 * class Config extends Envapter {
 *   // Provide fallback only
 *   \@Envapt('HOST', 'localhost')
 *   static readonly host: string;
 *
 *   // Provide fallback and converter
 *   \@Envapt('PORT', 8080, Number)
 *   static readonly port: number;
 * }
 * ```
 */
export function Envapt<TFallback extends string | number | boolean | bigint | symbol | undefined>(
    key: EnvKeyInput,
    fallback: InferPrimitiveFallbackType<TFallback>,
    converter?: PrimitiveConstructor
): PropertyDecorator;

/**
 * Instance/Static Property decorator that automatically loads and converts environment variables.
 */
export function Envapt<TFallback = unknown>(
    key: EnvKeyInput,
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
