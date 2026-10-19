import { createPropertyDecorator } from './createPropertyDecorator';
import { parseEnvaptOptions } from '../parseEnvaptOptions';

import type { ArrayOf } from '../../converters';
import type { InferSchemaOutput, StandardSchemaV1 } from '../../infra/StandardSchema';
import type {
    BuiltInConverter,
    ConverterFunction,
    EnvaptFieldDecorator,
    EnvKeyInput,
    FallbackOnlyReturn,
    FallbackOnlyValue,
    InferConverterFallbackType,
    InferConverterReturnType,
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
 * class Config extends Envapter {
 *   \@Envapt('ADMIN_EMAILS', { fallback: new Set<string>(), converter: (raw) => new Set(raw.split(',')) })
 *   static readonly adminEmails: Set<string>;
 *
 *   \@Envapt('LOG_FILE', { fallback: '/var/log/app.log' })
 *   static readonly logFile: string;
 * }
 * ```
 */
export function Envapt(
    key: EnvKeyInput,
    options?: { fallback: undefined; converter?: undefined }
): EnvaptFieldDecorator<string | undefined>;
export function Envapt<TFallback>(
    key: EnvKeyInput,
    options: { converter: ConverterFunction<TFallback | null | undefined>; fallback: TFallback }
): EnvaptFieldDecorator<TFallback>;
export function Envapt<TFallback extends FallbackOnlyValue | undefined>(
    key: EnvKeyInput,
    options: { fallback: TFallback; converter?: undefined }
): EnvaptFieldDecorator<FallbackOnlyReturn<TFallback>>;

/**
 * A custom converter function without a fallback. Omit `required` to get `undefined` for a missing
 * value, or pass `required: true` to throw `MissingEnvValue` on missing or empty values.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options
 * @public
 * @example
 * ```ts
 * class Config extends Envapter {
 *   \@Envapt('MAINTENANCE_UNTIL', { converter: (raw) => new Date(raw) })
 *   static readonly maintenanceUntil: Date | undefined;
 *
 *   \@Envapt('JWT_SECRET', { converter: (raw) => Buffer.from(raw, 'base64'), required: true })
 *   static readonly jwtSecret: Buffer;
 * }
 * ```
 */
export function Envapt<TReturnType>(
    key: EnvKeyInput,
    options: { converter: ConverterFunction<TReturnType>; required?: false }
): EnvaptFieldDecorator<NonNullable<TReturnType> | undefined>;
export function Envapt<TReturnType>(
    key: EnvKeyInput,
    options: { converter: ConverterFunction<TReturnType>; required: true }
): EnvaptFieldDecorator<NonNullable<TReturnType>>;

/**
 * A built-in or array converter with a fallback, or `required: true`. The converter sets the
 * fallback type, for example a number or time-string for `Converters.Time` and a `URL` instance
 * for `Converters.Url`.
 *
 * @param key - Environment variable name(s) to load
 * @param options - Configuration options
 * @public
 * @example
 * ```ts
 * import { Converters } from 'envapt';
 *
 * class Config extends Envapter {
 *   \@Envapt('APP_PORT', { converter: Converters.Port, fallback: 3000 })
 *   static readonly port: number;
 *
 *   \@Envapt('APP_URL', { converter: Converters.Url, fallback: new URL('http://localhost:3000') })
 *   static readonly url: URL;
 *
 *   // reads CANARY_URL when present, otherwise APP_URL
 *   \@Envapt(['CANARY_URL', 'APP_URL'], { converter: Converters.Url })
 *   static readonly canaryUrl: URL | undefined;
 *
 *   // Time takes a number (milliseconds) or a time-string fallback (`<number><unit>`)
 *   \@Envapt('REQUEST_TIMEOUT', { converter: Converters.Time, fallback: '10s' })
 *   static readonly requestTimeout: number;
 *
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
        | { converter: TConverter; fallback: InferConverterFallbackType<TConverter>; required?: false }
        | { converter: TConverter; required: true }
): EnvaptFieldDecorator<InferConverterReturnType<TConverter>>;
export function Envapt<TConverter extends BuiltInConverter | ArrayOf>(
    key: EnvKeyInput,
    options: { converter: TConverter; fallback?: undefined; required?: false }
): EnvaptFieldDecorator<InferConverterReturnType<TConverter> | undefined>;

/**
 * Required, no converter (raw string). Throws `MissingEnvValue` on first access when the env
 * value is missing or empty. Pairing `required: true` with `fallback` matches no overload at
 * compile time. A call that bypasses the types throws `InvalidUserDefinedConfig` at runtime.
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
export function Envapt(key: EnvKeyInput, options: { required: true }): EnvaptFieldDecorator<string>;

/**
 * A Standard Schema v1 schema (zod, valibot, arktype, or hand-written). Synchronous schemas only.
 * A `validate` that returns a Promise throws `InvalidUserDefinedConfig` at runtime. Pairing
 * `schema` with `converter` matches no overload at compile time. A call that bypasses the types
 * throws `InvalidUserDefinedConfig` at runtime.
 * @public
 */
export function Envapt<Schema extends StandardSchemaV1>(
    key: EnvKeyInput,
    options: { schema: SchemaConstraint<Schema>; fallback?: undefined; required?: false }
): EnvaptFieldDecorator<InferSchemaOutput<Schema> | undefined>;
export function Envapt<Schema extends StandardSchemaV1>(
    key: EnvKeyInput,
    options:
        | { schema: SchemaConstraint<Schema>; fallback: InferSchemaOutput<Schema>; required?: false }
        | { schema: SchemaConstraint<Schema>; required: true }
): EnvaptFieldDecorator<InferSchemaOutput<Schema>>;

/**
 * Instance or static property decorator that loads and converts an environment variable.
 * @see {@link https://envapt.materwelon.dev/docs/decorators#declaring-decorated-fields}
 */
export function Envapt<TFallback = unknown>(key: EnvKeyInput, options?: unknown): EnvaptFieldDecorator<unknown> {
    return createPropertyDecorator(key, parseEnvaptOptions<TFallback>(options)) as EnvaptFieldDecorator<unknown>;
}
