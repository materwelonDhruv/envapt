import { createPropertyDecorator } from './createPropertyDecorator';
import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { Validator } from '../Validators';

import type { ArrayOf } from '../converters';
import type { InferSchemaOutput, StandardSchemaV1 } from '../StandardSchema';
import type {
    BuiltInConverter,
    ConverterFunction,
    EnvKeyInput,
    EnvaptConverter,
    InferConverterFallbackType,
    InferPrimitiveReturnType,
    PrimitiveConstructor,
    SchemaConstraint
} from '../types';

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
 *   static readonly jwtSecret: Buffer;
 * }
 * ```
 */
export function Envapt<TReturnType>(
    key: EnvKeyInput,
    options:
        | { converter: ConverterFunction<TReturnType>; required?: false }
        | { converter: ConverterFunction<TReturnType>; required: true }
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
 *   // Url converter: the fallback is a URL instance, not a string
 *   \@Envapt('APP_URL', { converter: Converters.Url, fallback: new URL('http://localhost:3000') })
 *   static readonly url: URL;
 *
 *   // Prefer CANARY_URL when present, otherwise fall back to APP_URL
 *   \@Envapt(['CANARY_URL', 'APP_URL'], { converter: Converters.Url })
 *   static readonly canaryUrl: URL | null;
 *
 *   // `Converters.Time` accepts either a number (milliseconds) or a time-string fallback (`<number><unit>`).
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
 *   static readonly databaseUrl: URL;
 * }
 * ```
 */
export function Envapt<TConverter extends BuiltInConverter | ArrayOf>(
    key: EnvKeyInput,
    options:
        | { converter: TConverter; fallback?: InferConverterFallbackType<TConverter> | undefined; required?: false }
        | { converter: TConverter; required: true }
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
        | { converter: TConstructor; required: true }
): PropertyDecorator;

/**
 * Usage 5: Required, no converter (raw string). Throws `MissingEnvValue` on first access if
 * the env value is missing or empty (post-trim). Independent of global `Envapter.strict`.
 * Combining `required: true` with `fallback` fails to match any overload at compile time;
 * the runtime Validator catches dynamic objects that bypass the types.
 *
 * @param key - Environment variable name(s) to load
 * @param options - `{ required: true }`
 * @public
 * @example
 * ```ts
 * class Config extends Envapter {
 *   \@Envapt('API_KEY', { required: true })
 *   static readonly apiKey: string;
 * }
 * ```
 */
export function Envapt(key: EnvKeyInput, options: { required: true }): PropertyDecorator;

/**
 * No-fallback form. The property resolves from env or `null`.
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
 * Usage 6: Standard Schema v1 adapter (zod, valibot, arktype, hand-rolled). Synchronous
 * schemas only; a Promise-returning `validate` triggers a runtime
 * `InvalidUserDefinedConfig` throw. Combining `schema` with `converter` fails to match any
 * overload at compile time; the runtime Validator catches dynamic objects that bypass the
 * types.
 * @public
 */
export function Envapt<Schema extends StandardSchemaV1>(
    key: EnvKeyInput,
    options:
        | { schema: SchemaConstraint<Schema>; fallback?: InferSchemaOutput<Schema>; required?: false }
        | { schema: SchemaConstraint<Schema>; required: true }
): PropertyDecorator;

/**
 * Instance/Static Property decorator that automatically loads and converts environment variables.
 */
export function Envapt<TFallback = unknown>(key: EnvKeyInput, options?: unknown): PropertyDecorator {
    let fallback: TFallback | undefined;
    let actualConverter: EnvaptConverter<TFallback> | undefined;
    let actualSchema: StandardSchemaV1 | undefined;
    let hasFallback = false;
    let required = false;

    if (options !== undefined) {
        if (
            typeof options !== 'object' ||
            options === null ||
            !('fallback' in options || 'converter' in options || 'required' in options || 'schema' in options)
        ) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                'The positional `@Envapt(key, fallback, converter)` form was removed in v6. Pass an options object instead, like `@Envapt(key, { converter, fallback })`, or use one of the sugar decorators.'
            );
        }

        const opts = options as {
            fallback?: TFallback;
            converter?: EnvaptConverter<TFallback>;
            required?: boolean;
            schema?: unknown;
        };
        fallback = opts.fallback;
        actualConverter = opts.converter;
        hasFallback = 'fallback' in opts;
        required = opts.required === true;

        if (required && hasFallback && fallback !== undefined) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                '`required: true` and `fallback` are mutually exclusive on @Envapt options. Drop the fallback or call `Envapter.require()` separately.'
            );
        }

        if ('schema' in opts && opts.schema !== undefined) {
            if (!Validator.isStandardSchema(opts.schema)) {
                throw new EnvaptError(
                    EnvaptErrorCodes.InvalidUserDefinedConfig,
                    '`schema` must be a Standard Schema v1 object (zod, valibot, arktype, or any `~standard`-conformant value).'
                );
            }
            if (actualConverter !== undefined) {
                throw new EnvaptError(
                    EnvaptErrorCodes.InvalidUserDefinedConfig,
                    '`schema` and `converter` are mutually exclusive on @Envapt options. Drop one as they both turn a raw env string into a typed value.'
                );
            }
            actualSchema = opts.schema;
        }
    }

    return createPropertyDecorator(key, {
        fallback,
        converter: actualConverter,
        hasFallback,
        required,
        schema: actualSchema
    });
}
