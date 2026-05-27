import type { ArrayOf, ConverterToken, CustomElementConverter } from './Converters';
import type { Environment } from './core/EnvironmentMethods';
import type { DotenvConfigOptions } from 'dotenv';

/**
 * User defined options for dotenv configuration
 *
 * "processEnv" and "path" are managed by Envapter and should not be included in user-defined config.
 * @public
 */
type PermittedDotenvConfig = Omit<DotenvConfigOptions, 'processEnv' | 'path'>;

/**
 * Scalar built-in converter tokens (e.g. `'number'`, `'time'`).
 * Excludes the array builder (see {@link ArrayOf}).
 * @public
 */
type BuiltInConverter = ConverterToken;

/**
 * Primitive types supported by Envapter
 * @public
 */
type PrimitiveConstructor = typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol;

/**
 * String value from a .env file or environment variable
 * @public
 */
type BaseInput = string | undefined;

/**
 * Accepted shape for environment variable lookups. Either a single key or an ordered list of keys.
 * @public
 */
type EnvKeyInput = string | readonly [string, ...string[]];

/**
 * Custom parser function type for environment variables
 * @param raw - Raw string value from environment
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value of type T
 * @public
 */
type ConverterFunction<TFallback = unknown> = (raw: BaseInput, fallback?: TFallback) => TFallback;

/**
 * Environment variable converter: a primitive constructor, a built-in scalar token, an `ArrayOf<...>`
 * produced by {@link Converters.array}, or a custom parser function.
 * @public
 */
type EnvaptConverter<TFallback> = PrimitiveConstructor | BuiltInConverter | ArrayOf | ConverterFunction<TFallback>;

/**
 * Options for the \@Envapt decorator (modern API)
 * @public
 */
interface EnvaptOptions<TFallback = string> {
    /**
     * Default value to use if environment variable is not found
     */
    fallback?: TFallback;
    /**
     * Built-in converter, custom converter function, or boxed-primitives (String, Number, Boolean, Symbol, BigInt)
     * @see {@link EnvaptConverter} for details
     */
    converter?: EnvaptConverter<TFallback>;
}

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
interface JsonObject {
    [key: string]: JsonValue;
}

/**
 * JSON value types for custom converters
 * @public
 */
type JsonValue = JsonPrimitive | JsonArray | JsonObject;

interface ConverterMap {
    string: string;
    number: number;
    boolean: boolean;
    bigint: bigint;
    symbol: symbol;
    integer: number;
    float: number;
    json: JsonValue;
    url: URL;
    regexp: RegExp;
    date: Date;
    time: number;
}

/**
 * Type mapping for built-in scalar converters to their return types
 * @internal
 */
type BuiltInConverterReturnType<ConverterKey extends BuiltInConverter> = ConverterMap[ConverterKey];

/**
 * Return type for built-in converter functions
 * @internal
 */
type ReturnValuesOfConverterFunctions = ConverterMap[BuiltInConverter];

/**
 * Function type for built-in converter functions
 * @internal
 */
type BuiltInConverterFunction = (
    ...args: Parameters<(...args: any[]) => ReturnValuesOfConverterFunctions>
) => ReturnValuesOfConverterFunctions | undefined;

/**
 * Map of built-in converter functions
 * @internal
 */
type MapOfConverterFunctions = Record<BuiltInConverter, BuiltInConverterFunction>;

/**
 * Time unit types for duration conversions
 * @internal
 */
type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd' | 'w';

/**
 * Fallback type for time duration conversions
 * @public
 */
type TimeFallback = number | `${number}${TimeUnit}`;

/**
 * Helper type for getter methods that conditionally return undefined based on whether a fallback is provided
 * If fallback is provided, return ReturnType. If no fallback (undefined), return ReturnType | undefined.
 * @internal
 */
type ConditionalReturn<ReturnType, TFallback> = TFallback extends undefined ? ReturnType | undefined : ReturnType;

/**
 * Inferred return type for a converter.
 *
 * - `ArrayOf<E>` resolves to the element type's return as an array. When `E` is a custom
 *   function, the function's return type drives the array element. When `E` is a scalar
 *   token, `ConverterMap` provides the element type.
 * - Bare scalar tokens resolve through `ConverterMap`.
 * @internal
 */
type InferConverterReturnType<TConverter> =
    TConverter extends ArrayOf<infer Element>
        ? Element extends BuiltInConverter
            ? ConverterMap[Element][]
            : Element extends CustomElementConverter<infer Returned>
              ? Returned[]
              : never
        : TConverter extends BuiltInConverter
          ? BuiltInConverterReturnType<TConverter>
          : never;

/**
 * Type inference for the *fallback* slot of a converter. `Converters.Time` (scalar or array
 * element) accepts {@link TimeFallback} / `TimeFallback[]`; everything else mirrors the
 * return type. Add future asymmetric fallback/return converters to this conditional.
 * @internal
 */
type InferConverterFallbackType<TConverter> = TConverter extends 'time'
    ? TimeFallback
    : TConverter extends ArrayOf<infer Element>
      ? Element extends 'time'
          ? TimeFallback[]
          : InferConverterReturnType<TConverter>
      : InferConverterReturnType<TConverter>;

/**
 * Complete type inference for advanced converter methods
 * @internal
 */
type AdvancedConverterReturn<TConverter, TFallback = undefined> = ConditionalReturn<
    InferConverterReturnType<TConverter>,
    TFallback
>;

/**
 * Type inference for primitive constructor return types
 * @internal
 */
type InferPrimitiveReturnType<TConstructor extends PrimitiveConstructor> = TConstructor extends typeof String
    ? string
    : TConstructor extends typeof Number
      ? number
      : TConstructor extends typeof Boolean
        ? boolean
        : TConstructor extends typeof BigInt
          ? bigint
          : TConstructor extends typeof Symbol
            ? symbol
            : never;

/**
 * Type inference for primitive fallback values
 * @internal
 */
type InferPrimitiveFallbackType<TFallback extends string | number | boolean | bigint | symbol | undefined> =
    TFallback extends string
        ? string
        : TFallback extends number
          ? number
          : TFallback extends boolean
            ? boolean
            : TFallback extends bigint
              ? bigint
              : TFallback extends symbol
                ? symbol
                : undefined;

/**
 * Per-environment profile entry passed to {@link configureProfiles}.
 * @public
 */
interface EnvProfile {
    /** One or more `.env` paths to load for this environment. Order matters: earlier paths take precedence. */
    paths: string | string[];
}

/**
 * Configuration object for {@link configureProfiles}. Maps each `Environment` to an optional
 * profile override. Unspecified environments fall through to the default cascade behavior
 * (`.env.${env}.local`, `.env.local`, `.env.${env}`, `.env`).
 * @public
 */
type ProfilesConfig = Partial<Record<Environment, EnvProfile>> & {
    /**
     * When `false`, disables the default dotenv-flow cascade entirely. Only the explicitly
     * configured paths are loaded. Defaults to `true` (cascade still runs, configured paths
     * are layered on top with higher precedence).
     */
    useDefaults?: boolean;
};

export type {
    PermittedDotenvConfig,
    BuiltInConverter,
    PrimitiveConstructor,
    ConverterFunction,
    EnvaptConverter,
    EnvaptOptions,
    EnvProfile,
    ProfilesConfig,
    JsonValue,
    BuiltInConverterFunction,
    MapOfConverterFunctions,
    TimeUnit,
    TimeFallback,
    ConditionalReturn,
    InferConverterReturnType,
    InferConverterFallbackType,
    AdvancedConverterReturn,
    InferPrimitiveReturnType,
    InferPrimitiveFallbackType,
    EnvKeyInput
};
