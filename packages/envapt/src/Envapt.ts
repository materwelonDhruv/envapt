import { EnvaptCache } from './core/EnvapterBase';
import { Envapter } from './Envapter';
import { EnvaptError, EnvaptErrorCodes } from './Error';
import { Parser } from './Parser';

import type { ArrayOf } from './Converters';
import type {
    BuiltInConverter,
    ConverterFunction,
    EnvKeyInput,
    EnvaptConverter,
    EnvaptOptions,
    InferConverterFallbackType,
    InferPrimitiveFallbackType,
    InferPrimitiveReturnType,
    PrimitiveConstructor,
    RequiredAndFallbackMutex
} from './Types';

function formatKeyForError(key: EnvKeyInput): string {
    return Array.isArray(key) ? `[${key.join(', ')}]` : String(key);
}

function createPropertyDecorator<TFallback>(
    key: EnvKeyInput,
    fallback: TFallback | undefined,
    converter: EnvaptConverter<TFallback> | undefined,
    hasFallback: boolean,
    required: boolean
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

                if (value === undefined) {
                    const envapter = new Envapter();

                    if (required) {
                        const rawValue = envapter.getRaw(key);
                        if (rawValue === undefined || rawValue.trim() === '') {
                            throw new EnvaptError(
                                EnvaptErrorCodes.MissingEnvValue,
                                `Required environment variable "${formatKeyForError(key)}" is missing or empty.`
                            );
                        }
                    }

                    const parser = new Parser(envapter);
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
 * Usage 1: Either a custom converter function + fallback (both required), OR a fallback
 * only (no converter).
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options
 * @public
 * @example
 * ```ts
 * class Config extends Envapter {
 *   // Custom converter that validates a non-empty API key
 *   \@Envapt('API_KEY', {
 *     fallback: 'default-key',
 *     converter(raw, _fallback) {
 *       if (!raw || raw.trim() === '') throw new Error('API_KEY required');
 *       return raw.trim();
 *     }
 *   })
 *   static readonly apiKey: string;
 *
 *   // Fallback-only (no converter): string fallback
 *   \@Envapt('LOG_FILE', { fallback: '/var/log/app.log' })
 *   static readonly logFile: string;
 *
 *   // Fallback-only: arbitrary object fallback
 *   \@Envapt('RETRY_POLICY', { fallback: { retries: 3, backoff: 'exponential' } })
 *   static readonly retryPolicy: unknown;
 * }
 * ```
 */
export function Envapt<TFallback>(
    key: EnvKeyInput,
    options:
        | { converter: (raw: string | undefined, fallback: TFallback) => TFallback; fallback: TFallback }
        | { fallback: TFallback; converter?: undefined }
): PropertyDecorator;

/**
 * Usage 2: Custom converter function without fallback. Either omit `required` (returns the
 * converter's output, possibly `undefined`) or pass `required: true` to throw `MissingEnvValue`
 * on missing/empty values.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options with custom converter only, with optional `required: true`
 * @public
 * @example
 * ```ts
 * class Config extends Envapter {
 *   \@Envapt('FEATURE_FLAGS', { converter(raw) {
 *     return raw ? raw.split('|').map(s => s.trim()) : [];
 *   } })
 *   static readonly featureFlags: string[];
 *
 *   \@Envapt('JWT_SECRET', {
 *     converter: (raw) => Buffer.from(raw ?? '', 'base64'),
 *     required: true
 *   })
 *   declare static readonly jwtSecret: Buffer;
 * }
 * ```
 */
export function Envapt<TReturnType>(
    key: EnvKeyInput,
    options:
        | { converter: ConverterFunction<TReturnType>; required?: false }
        | { converter: ConverterFunction<TReturnType>; required: true; fallback?: RequiredAndFallbackMutex }
): PropertyDecorator;

/**
 * Usage 3: Built-in or array converter with optional fallback OR `required: true`.
 *
 * `InferConverterFallbackType` handles asymmetric cases: scalar `Converters.Time` accepts
 * `TimeFallback`, and `ArrayOf<'time'>` accepts `TimeFallback[]`. Every other converter
 * reduces to `InferConverterReturnType`. The two object-shape branches are mutually
 * exclusive: either provide a `fallback`, or pass `required: true` to throw
 * `MissingEnvValue` on missing/empty values.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options
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
 *
 *   // `Converters.Time` accepts either a number (milliseconds) or a time-string fallback (`<integer><unit>`).
 *   \@Envapt('REQUEST_TIMEOUT', { converter: Converters.Time, fallback: '10s' })
 *   static readonly requestTimeout: number;
 *
 *   // Array converter: comma-separated list of origins -> string[]
 *   \@Envapt('ALLOWED_ORIGINS', {
 *     converter: Converters.array({ of: Converters.String }),
 *     fallback: ['https://example.com']
 *   })
 *   static readonly allowedOrigins: string[];
 *
 *   \@Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
 *   declare static readonly databaseUrl: URL;
 * }
 * ```
 */
export function Envapt<TConverter extends BuiltInConverter | ArrayOf>(
    key: EnvKeyInput,
    options:
        | { converter: TConverter; fallback?: InferConverterFallbackType<TConverter> | undefined; required?: false }
        | { converter: TConverter; required: true; fallback?: RequiredAndFallbackMutex }
): PropertyDecorator;

/**
 * Usage 4: Primitive constructor with optional fallback
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
    options:
        | { converter: TConstructor; fallback?: InferPrimitiveReturnType<TConstructor>; required?: false }
        | { converter: TConstructor; required: true; fallback?: RequiredAndFallbackMutex }
): PropertyDecorator;

/**
 * Usage 5: Required, no converter (raw string). Throws `MissingEnvValue` on first access if
 * the env value is missing or empty (post-trim). Independent of global `Envapter.strict`.
 * Mutually exclusive with `fallback`: combining them fails to match any overload at compile
 * time. The runtime Validator catches dynamic objects that bypass the types.
 *
 * @param key - Environment variable name(s) to load
 * @param options - `{ required: true }`
 * @public
 * @example
 * ```ts
 * class Config extends Envapter {
 *   \@Envapt('API_KEY', { required: true })
 *   declare static readonly apiKey: string;
 * }
 * ```
 */
export function Envapt(
    key: EnvKeyInput,
    options: { required: true; fallback?: RequiredAndFallbackMutex }
): PropertyDecorator;

/**
 * Classic API: No fallback
 *
 * @param key - Environment variable name(s) to load
 * @public
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

// Repeat of Usage 3 as the LAST non-impl overload. TS's "no overload matches" diagnostic
// reports against the last declared candidate; this placement makes that diagnostic
// surface the `RequiredAndFallbackMutex` branded literal in the chain (otherwise TS
// reports against the classic positional API above and the explanation is masked).
export function Envapt<TConverter extends BuiltInConverter | ArrayOf>(
    key: EnvKeyInput,
    options:
        | { converter: TConverter; fallback?: InferConverterFallbackType<TConverter> | undefined; required?: false }
        | { converter: TConverter; required: true; fallback?: RequiredAndFallbackMutex }
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
    let required = false;

    if (
        fallbackOrOptions &&
        typeof fallbackOrOptions === 'object' &&
        ('fallback' in fallbackOrOptions || 'converter' in fallbackOrOptions || 'required' in fallbackOrOptions)
    ) {
        const options = fallbackOrOptions as {
            fallback?: TFallback;
            converter?: EnvaptConverter<TFallback>;
            required?: boolean;
        };
        fallback = options.fallback;
        actualConverter = options.converter;
        hasFallback = 'fallback' in options;
        required = options.required === true;

        if (required && hasFallback && fallback !== undefined) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                '`required: true` and `fallback` are mutually exclusive on @Envapt options. Drop the fallback or call `Envapter.require()` separately.'
            );
        }
    } else {
        // Classic API
        fallback = fallbackOrOptions as TFallback;
        actualConverter = converter;
        hasFallback = arguments.length > 1;
    }

    return createPropertyDecorator(key, fallback, actualConverter, hasFallback, required);
}
