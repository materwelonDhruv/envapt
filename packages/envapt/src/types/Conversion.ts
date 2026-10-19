import type { ArrayOf, ConverterToken } from '../converters/Converters';
import type { InferSchemaOutput, StandardSchemaV1 } from '../infra/StandardSchema';

// scalar tokens only
type BuiltInConverter = ConverterToken;

/**
 * Custom converter for an environment variable or an array element. It receives a present value with templates
 * already expanded. envapt applies the fallback itself. A return of `undefined` or `null` means the value could
 * not be converted. From `getAs` and an optional `@Envapt`, an error the converter throws reaches the caller as
 * is. A required read reports it as an `InvalidEnvValue` issue carrying its message.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/converters#custom-converters}
 */
type ConverterFunction<TReturn = unknown> = ((raw: string) => TReturn) & {
    readonly '~standard'?: never;
    // a constructor like Number has a typed prototype
    readonly prototype?: undefined;
};

type EnvaptConverter<TFallback> = BuiltInConverter | ArrayOf | ConverterFunction<TFallback>;

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

// tokenForFallback in converters/Field.ts picks one of these from the fallback's typeof
type FallbackToken = 'string' | 'number' | 'boolean' | 'bigint';

type FallbackOnlyValue = ConverterMap[FallbackToken];

type TokenForFallback<TFallback extends FallbackOnlyValue> = TFallback extends string
    ? 'string'
    : TFallback extends number
      ? 'number'
      : TFallback extends boolean
        ? 'boolean'
        : TFallback extends bigint
          ? 'bigint'
          : never;

// widens a literal fallback such as '/var/log/app.log' to string
type FallbackOnlyReturn<TFallback extends FallbackOnlyValue | undefined> =
    | ConverterMap[TokenForFallback<Exclude<TFallback, undefined>>]
    | (undefined extends TFallback ? string | undefined : never);

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

type RequiredConverter = Exclude<RequiredSpec[string], StandardSchemaV1>;

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

export type {
    BuiltInConverter,
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
    RequiredSpec,
    RequiredConverter,
    InferSpecField,
    FallbackToken,
    FallbackOnlyValue,
    FallbackOnlyReturn
};
