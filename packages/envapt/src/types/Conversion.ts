import type { ArrayOf, ConverterToken, CustomElementConverter } from '../converters/Converters';

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

export type {
    BuiltInConverter,
    PrimitiveConstructor,
    ConverterFunction,
    EnvaptConverter,
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
    InferPrimitiveFallbackType
};
