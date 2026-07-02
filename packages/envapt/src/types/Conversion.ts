import type { ArrayOf, ConverterToken, CustomElementConverter } from '../converters/Converters';

// the scalar tokens, not the array() builder
type BuiltInConverter = ConverterToken;

type PrimitiveConstructor = typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol;

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

type BuiltInConverterReturnType<ConverterKey extends BuiltInConverter> = ConverterMap[ConverterKey];

type ReturnValuesOfConverterFunctions = ConverterMap[BuiltInConverter];

type BuiltInConverterFunction = (
    ...args: Parameters<(...args: any[]) => ReturnValuesOfConverterFunctions>
) => ReturnValuesOfConverterFunctions | undefined;

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

type ConditionalReturn<ReturnType, TFallback> = TFallback extends undefined ? ReturnType | undefined : ReturnType;

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

// time's fallback (TimeFallback) differs from its return, so add future asymmetric converters here
type InferConverterFallbackType<TConverter> = TConverter extends 'time'
    ? TimeFallback
    : TConverter extends ArrayOf<infer Element>
      ? Element extends 'time'
          ? TimeFallback[]
          : InferConverterReturnType<TConverter>
      : InferConverterReturnType<TConverter>;

type AdvancedConverterReturn<TConverter, TFallback = undefined> = ConditionalReturn<
    InferConverterReturnType<TConverter>,
    TFallback
>;

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
    InferPrimitiveReturnType
};
