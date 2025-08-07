import type { Converters, ArrayElementConverter, ConverterValue, ArrayElementConverterValue } from './Converters';
import type { DotenvConfigOptions } from 'dotenv';

/**
 * User defined options for dotenv configuration
 *
 * "processEnv" and "path" are managed by Envapter and should not be included in user-defined config.
 * @public
 */
type PermittedDotenvConfig = Omit<DotenvConfigOptions, 'processEnv' | 'path'>;

/**
 * Built-in converter types for common environment variable patterns
 * @public
 */
type BuiltInConverter = ConverterValue | Converters;

/**
 * Primitive types supported by Envapter
 * @public
 */
type PrimitiveConstructor = typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol;

/**
 * Valid array converter element types (excludes array, json, regexp)
 * @public
 */
type ValidArrayConverterBuiltInType = ArrayElementConverterValue | ArrayElementConverter;

/**
 * Array converter configuration for custom delimiters and element types
 * @public
 */
interface ArrayConverter {
  /**
   * Delimiter to split the string by
   */
  delimiter: string;
  /**
   * Type to convert each array element to (excludes array, json, and regexp types)
   */
  type?: ArrayElementConverter | ArrayElementConverterValue;
}

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
 * Environment variable converter - can be a primitive constructor, built-in converter string, array converter object, or custom parser function
 * @see {@link PrimitiveConstructor} for primitive types
 * @see {@link Converters} for built-in types
 * @see {@link ArrayConverter} for array converter configuration
 * @see {@link ConverterFunction} for custom parser functions
 * @public
 */
type EnvaptConverter<TFallback> =
  | PrimitiveConstructor
  | Converters
  | ConverterValue
  | ArrayConverter
  | ConverterFunction<TFallback>;

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
 * @internal
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
  array: string[];
  url: URL;
  regexp: RegExp;
  date: Date;
  time: number;
}

/**
 * Type mapping for built-in converters to their return types
 * @internal
 */
type BuiltInConverterReturnType<ConverterKey extends BuiltInConverter> = ConverterKey extends Converters
  ? ConverterMap[`${ConverterKey}`]
  : ConverterKey extends keyof ConverterMap
    ? ConverterMap[ConverterKey]
    : never;

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
type TimeUnit = 'ms' | 's' | 'm' | 'h';

/**
 * Helper type for getter methods that conditionally return undefined based on whether a fallback is provided
 * If fallback is provided, return ReturnType. If no fallback (undefined), return ReturnType | undefined.
 * @internal
 */
type ConditionalReturn<ReturnType, TFallback> = TFallback extends undefined ? ReturnType | undefined : ReturnType;

/**
 * Advanced type inference for built-in and array converters
 * Maps converter types to their expected return types
 * @internal
 */
type InferConverterReturnType<TConverter extends BuiltInConverter | ArrayConverter> =
  TConverter extends BuiltInConverter
    ? BuiltInConverterReturnType<TConverter>
    : TConverter extends ArrayConverter
      ? TConverter['type'] extends BuiltInConverter
        ? BuiltInConverterReturnType<TConverter['type']>[]
        : string[]
      : unknown[];

/**
 * Complete type inference for advanced converter methods
 * @internal
 */
type AdvancedConverterReturn<
  TConverter extends BuiltInConverter | ArrayConverter,
  TFallback = undefined
> = ConditionalReturn<InferConverterReturnType<TConverter>, TFallback>;

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
  PermittedDotenvConfig,
  BuiltInConverter,
  PrimitiveConstructor,
  ValidArrayConverterBuiltInType,
  ArrayConverter,
  ConverterFunction,
  EnvaptConverter,
  EnvaptOptions,
  JsonValue,
  BuiltInConverterFunction,
  MapOfConverterFunctions,
  TimeUnit,
  ConditionalReturn,
  InferConverterReturnType,
  AdvancedConverterReturn,
  InferPrimitiveReturnType,
  InferPrimitiveFallbackType
};
