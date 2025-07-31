import type { ListOfBuiltInConverters } from './ListOfBuiltInConverters';

/**
 * Built-in converter types for common environment variable patterns
 * @public
 */
type BuiltInConverter = (typeof ListOfBuiltInConverters)[number];

/**
 * Primitive types supported by Envapter
 * @public
 */
type PrimitiveConstructor = typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol;

type ValidArrayConverterBuiltInType = Exclude<BuiltInConverter, 'array' | 'json' | 'regexp'>;

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
  type?: ValidArrayConverterBuiltInType;
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
type ConverterFunction<FallbackType = unknown> = (raw: BaseInput, fallback?: FallbackType) => FallbackType;

/**
 * Environment variable converter - can be a primitive constructor, built-in converter string, array converter object, or custom parser function
 * @see {@link PrimitiveConstructor} for primitive types
 * @see {@link BuiltInConverter} for built-in types
 * @see {@link ArrayConverter} for array converter configuration
 * @see {@link ConverterFunction} for custom parser functions
 * @public
 */
type EnvaptConverter<FallbackType> =
  | PrimitiveConstructor
  | BuiltInConverter
  | ArrayConverter
  | ConverterFunction<FallbackType>;

/**
 * Options for the \@Envapt decorator (modern API)
 * @public
 */
interface EnvaptOptions<FallbackType = string> {
  /**
   * Default value to use if environment variable is not found
   */
  fallback?: FallbackType;
  /**
   * Built-in converter, custom converter function, or boxed-primitives (String, Number, Boolean)
   * @see {@link EnvaptConverter} for details
   */
  converter?: EnvaptConverter<FallbackType>;
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
type BuiltInConverterReturnType<ConverterKey extends BuiltInConverter = BuiltInConverter> = ConverterMap[ConverterKey];

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

export type {
  BuiltInConverter,
  PrimitiveConstructor,
  ValidArrayConverterBuiltInType,
  ArrayConverter,
  BaseInput,
  ConverterFunction,
  EnvaptConverter,
  EnvaptOptions,
  JsonValue,
  BuiltInConverterReturnType,
  BuiltInConverterFunction,
  MapOfConverterFunctions
};
