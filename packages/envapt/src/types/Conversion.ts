import type { ArrayOf, ConverterToken, CustomElementConverter } from '../converters/Converters';

// scalar tokens only
type BuiltInConverter = ConverterToken;

type PrimitiveConstructor = typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol;

type BaseInput = string | undefined;

/**
 * Custom parser function for an environment variable. `TRaw` is the raw input, `string | undefined` by
 * default, narrowed to `string` by the readers that guarantee a present value (`getRequired`, `getRequiredAll`).
 * @param raw - Raw value from the environment
 * @param fallback - Fallback value when parsing is skipped
 * @returns Parsed value of type `TFallback`
 * @public
 */
type ConverterFunction<TFallback = unknown, TRaw extends BaseInput = BaseInput> = (
    raw: TRaw,
    fallback?: TFallback
) => TFallback;

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

// raw is `string` here (getRequiredAll throws before converting, so the value is always present).
type RequiredSpec = Record<string, BuiltInConverter | ArrayOf | ConverterFunction<unknown, string>>;

// InferConverterReturnType is never for a function, so a custom parser recovers its type from the return.
// Match the bare `(raw) => infer R` form. `ConverterFunction<infer R>` would fail here because a required
// parser's `raw: string` isn't assignable to ConverterFunction's `raw: string | undefined`, hitting never.
type InferSpecField<TConverter> = TConverter extends BuiltInConverter | ArrayOf
    ? InferConverterReturnType<TConverter>
    : TConverter extends (raw: string) => infer TReturn
      ? TReturn
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
    InferPrimitiveReturnType,
    RequiredSpec,
    InferSpecField
};
