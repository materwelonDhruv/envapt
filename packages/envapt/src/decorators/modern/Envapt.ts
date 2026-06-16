import { createAccessorDecorator } from './createAccessorDecorator';
import { parseEnvaptOptions } from '../parseEnvaptOptions';

import type { ArrayOf } from '../../converters';
import type { InferSchemaOutput, StandardSchemaV1 } from '../../StandardSchema';
import type {
    BuiltInConverter,
    ConverterFunction,
    EnvaptAccessorDecorator,
    EnvKeyInput,
    InferConverterFallbackType,
    InferConverterReturnType,
    InferPrimitiveReturnType,
    PrimitiveConstructor,
    SchemaConstraint
} from '../../types';

/**
 * A custom converter function with a fallback (both required), or a fallback only.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options
 * @public
 * @example
 * ```ts
 * class Config {
 *   \@Envapt('API_KEY', {
 *     fallback: 'default-key',
 *     converter(raw, _fallback) {
 *       if (!raw || raw.trim() === '') throw new Error('API_KEY required');
 *       return raw.trim();
 *     }
 *   })
 *   static accessor apiKey: string;
 *
 *   \@Envapt('LOG_FILE', { fallback: '/var/log/app.log' })
 *   static accessor logFile: string;
 *
 *   \@Envapt('RETRY_POLICY', { fallback: { retries: 3, backoff: 'exponential' } })
 *   static accessor retryPolicy: unknown;
 * }
 * ```
 */
export function Envapt(
    key: EnvKeyInput,
    options: { fallback: undefined; converter?: undefined }
): EnvaptAccessorDecorator<string | undefined>;
export function Envapt<TFallback>(
    key: EnvKeyInput,
    options:
        | { converter: (raw: string | undefined, fallback: TFallback) => TFallback; fallback: TFallback }
        | { fallback: TFallback; converter?: undefined }
): EnvaptAccessorDecorator<TFallback>;

/**
 * A custom converter function without a fallback. Omit `required` to return the converter's
 * output (possibly `undefined`), or pass `required: true` to throw `MissingEnvValue` on
 * missing or empty values.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options
 * @public
 * @example
 * ```ts
 * class Config {
 *   \@Envapt('FEATURE_FLAGS', { converter(raw) {
 *     return raw ? raw.split('|').map(s => s.trim()) : [];
 *   } })
 *   static accessor featureFlags: string[];
 *
 *   \@Envapt('JWT_SECRET', {
 *     converter: (raw) => Buffer.from(raw ?? '', 'base64'),
 *     required: true
 *   })
 *   static accessor jwtSecret: Buffer;
 * }
 * ```
 */
export function Envapt<TReturnType>(
    key: EnvKeyInput,
    options:
        | { converter: ConverterFunction<TReturnType>; required?: false }
        | { converter: ConverterFunction<TReturnType>; required: true }
): EnvaptAccessorDecorator<TReturnType>;

/**
 * A built-in or array converter with a fallback, or `required: true`. The fallback type tracks
 * the converter, so `Converters.Time` takes a number or time-string and `Converters.Url` takes
 * a `URL` instance.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options
 * @public
 * @example
 * ```ts
 * import { Converters } from 'envapt';
 *
 * class Config {
 *   \@Envapt('APP_PORT', { converter: Converters.Number, fallback: 3000 })
 *   static accessor port: number;
 *
 *   // the Url fallback is a URL instance, not a string
 *   \@Envapt('APP_URL', { converter: Converters.Url, fallback: new URL('http://localhost:3000') })
 *   static accessor url: URL;
 *
 *   // prefers CANARY_URL when present, otherwise APP_URL
 *   \@Envapt(['CANARY_URL', 'APP_URL'], { converter: Converters.Url })
 *   static accessor canaryUrl: URL | null;
 *
 *   // Time takes a number (milliseconds) or a time-string fallback (`<number><unit>`)
 *   \@Envapt('REQUEST_TIMEOUT', { converter: Converters.Time, fallback: '10s' })
 *   static accessor requestTimeout: number;
 *
 *   \@Envapt('ALLOWED_ORIGINS', {
 *     converter: Converters.array({ of: Converters.String }),
 *     fallback: ['https://example.com']
 *   })
 *   static accessor allowedOrigins: string[];
 *
 *   \@Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
 *   static accessor databaseUrl: URL;
 * }
 * ```
 */
export function Envapt<TConverter extends BuiltInConverter | ArrayOf>(
    key: EnvKeyInput,
    options:
        | { converter: TConverter; fallback: InferConverterFallbackType<TConverter>; required?: false }
        | { converter: TConverter; required: true }
): EnvaptAccessorDecorator<InferConverterReturnType<TConverter>>;
export function Envapt<TConverter extends BuiltInConverter | ArrayOf>(
    key: EnvKeyInput,
    options: { converter: TConverter; fallback: undefined; required?: false }
): EnvaptAccessorDecorator<InferConverterReturnType<TConverter> | undefined>;
export function Envapt<TConverter extends BuiltInConverter | ArrayOf>(
    key: EnvKeyInput,
    options: { converter: TConverter; required?: false }
): EnvaptAccessorDecorator<InferConverterReturnType<TConverter> | null>;

/**
 * A primitive constructor (`Number`, `Boolean`) with an optional fallback.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options
 * @public
 * @example
 * ```ts
 * class Config {
 *   \@Envapt('MAX_CONNECTIONS', { converter: Number, fallback: 100 })
 *   static accessor maxConnections: number;
 *
 *   \@Envapt('FEATURE_ENABLED', { converter: Boolean, fallback: false })
 *   static accessor featureEnabled: boolean;
 * }
 * ```
 */
export function Envapt<TConstructor extends PrimitiveConstructor>(
    key: EnvKeyInput,
    options:
        | { converter: TConstructor; fallback: InferPrimitiveReturnType<TConstructor>; required?: false }
        | { converter: TConstructor; required: true }
): EnvaptAccessorDecorator<InferPrimitiveReturnType<TConstructor>>;
export function Envapt<TConstructor extends PrimitiveConstructor>(
    key: EnvKeyInput,
    options: { converter: TConstructor; fallback: undefined; required?: false }
): EnvaptAccessorDecorator<InferPrimitiveReturnType<TConstructor> | undefined>;
export function Envapt<TConstructor extends PrimitiveConstructor>(
    key: EnvKeyInput,
    options: { converter: TConstructor; required?: false }
): EnvaptAccessorDecorator<InferPrimitiveReturnType<TConstructor> | null>;

/**
 * Required, no converter (raw string). Throws `MissingEnvValue` on first access when the env
 * value is missing or empty after trimming, independent of the global `Envapter.strict` flag.
 * Pairing `required: true` with `fallback` matches no overload at compile time, and the runtime
 * Validator rejects dynamic objects that bypass the types.
 *
 * @param key - Environment variable name(s) to load
 * @param options - `{ required: true }`
 * @public
 * @example
 * ```ts
 * class Config {
 *   \@Envapt('API_KEY', { required: true })
 *   static accessor apiKey: string;
 * }
 * ```
 */
export function Envapt(key: EnvKeyInput, options: { required: true }): EnvaptAccessorDecorator<string>;

/**
 * No-fallback form. The property resolves from env or `null`.
 *
 * @param key - Environment variable name(s) to load
 * @public
 * @example
 * ```ts
 * class Config {
 *   \@Envapt('SIMPLE_VALUE')
 *   static accessor simple: string | null;
 * }
 * ```
 */
export function Envapt(key: EnvKeyInput): EnvaptAccessorDecorator<string | null>;

/**
 * A Standard Schema v1 adapter (zod, valibot, arktype, hand-rolled). Synchronous schemas only,
 * so a Promise-returning `validate` throws `InvalidUserDefinedConfig` at runtime. Pairing
 * `schema` with `converter` matches no overload at compile time, and the runtime Validator
 * rejects dynamic objects that bypass the types.
 * @public
 */
export function Envapt<Schema extends StandardSchemaV1>(
    key: EnvKeyInput,
    options:
        | { schema: SchemaConstraint<Schema>; fallback?: InferSchemaOutput<Schema>; required?: false }
        | { schema: SchemaConstraint<Schema>; required: true }
): EnvaptAccessorDecorator<InferSchemaOutput<Schema>>;

/**
 * Modern (TC39 Stage 3) accessor decorator that loads and converts an environment variable. The
 * decorated property uses the `accessor` keyword and needs no `experimentalDecorators` flag.
 * Instance accessors need the definite-assignment `!`, static accessors do not.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Converter, fallback, `required`, or `schema`. See the overloads.
 * @public
 * @example
 * ```ts
 * import { Envapt, Converters } from 'envapt';
 *
 * class Config {
 *   \@Envapt('APP_PORT', { converter: Converters.Number, fallback: 3000 })
 *   static accessor port: number;
 *
 *   \@Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
 *   accessor databaseUrl!: URL;
 * }
 * ```
 */
export function Envapt<TFallback = unknown>(key: EnvKeyInput, options?: unknown): EnvaptAccessorDecorator<unknown> {
    return createAccessorDecorator(key, parseEnvaptOptions<TFallback>(options)) as EnvaptAccessorDecorator<unknown>;
}
