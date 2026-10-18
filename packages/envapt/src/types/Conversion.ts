import type { ArrayOf, ConverterToken } from '../converters/Converters';
import type { InferSchemaOutput, StandardSchemaV1 } from '../infra/StandardSchema';

// scalar tokens only
type BuiltInConverter = ConverterToken;

type PrimitiveConstructor = typeof String | typeof Number | typeof Boolean | typeof BigInt;

/**
 * Custom converter for an environment variable or an array element. It receives a present value with templates
 * already expanded. envapt applies the fallback itself. A return of `undefined` or `null` means the value could
 * not be converted. From `getUsing` and an optional `@Envapt`, an error the converter throws reaches the caller as
 * is. A required read reports it as an `InvalidEnvValue` issue carrying its message.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/converters#custom-converters}
 */
type ConverterFunction<TReturn = unknown> = ((raw: string) => TReturn) & { readonly '~standard'?: never };

type EnvaptConverter<TFallback> = PrimitiveConstructor | BuiltInConverter | ArrayOf | ConverterFunction<TFallback>;

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
interface JsonObject {
    [key: string]: JsonValue;
}

/**
 * JSON value types for custom converters
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/converters#json}
 */
type JsonValue = JsonPrimitive | JsonArray | JsonObject;

interface ConverterMap {
    string: string;
    number: number;
    boolean: boolean;
    bigint: bigint;
    integer: number;
    float: number;
    json: JsonValue;
    url: URL;
    regexp: RegExp;
    date: Date;
    time: number;
    port: number;
    email: string;
}

type BuiltInConverterReturnType<ConverterKey extends BuiltInConverter> = ConverterMap[ConverterKey];

type ReturnValuesOfConverterFunctions = ConverterMap[BuiltInConverter];

type BuiltInConverterFunction = (
    ...args: Parameters<(...args: any[]) => ReturnValuesOfConverterFunctions>
) => ReturnValuesOfConverterFunctions | undefined;

type MapOfConverterFunctions = Record<BuiltInConverter, BuiltInConverterFunction>;

type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd' | 'w';

/**
 * Fallback type for time duration conversions
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/converters#time-and-durations}
 */
type TimeFallback = number | `${number}${TimeUnit}`;

type ConditionalReturn<ReturnType, TFallback> = TFallback extends undefined ? ReturnType | undefined : ReturnType;

type InferConverterReturnType<TConverter> =
    TConverter extends ArrayOf<infer Element>
        ? Element extends BuiltInConverter
            ? ConverterMap[Element][]
            : Element extends ConverterFunction<infer Returned>
              ? NonNullable<Returned>[]
              : never
        : TConverter extends BuiltInConverter
          ? BuiltInConverterReturnType<TConverter>
          : never;

type RequiredSpec = Record<string, BuiltInConverter | ArrayOf | ConverterFunction | StandardSchemaV1<unknown, unknown>>;

type RequiredConverter = Exclude<RequiredSpec[string], StandardSchemaV1> | PrimitiveConstructor;

// arktype schemas are callable and would match the converter branch
type InferSpecField<TField> = TField extends StandardSchemaV1
    ? InferSchemaOutput<TField>
    : TField extends BuiltInConverter | ArrayOf
      ? InferConverterReturnType<TField>
      : TField extends ConverterFunction<infer TReturn>
        ? NonNullable<TReturn>
        : never;

// add any converter whose fallback type differs from its return type here
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
    RequiredConverter,
    InferSpecField
};
