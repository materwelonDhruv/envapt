/**
 * Enum for built-in converters
 * @public
 */
export enum Converters {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Bigint = 'bigint',
  Symbol = 'symbol',
  Integer = 'integer',
  Float = 'float',
  Json = 'json',
  Array = 'array',
  Url = 'url',
  Regexp = 'regexp',
  Date = 'date',
  Time = 'time'
}

/**
 * Type alias for converter values to maintain compatibility with existing string-based API
 * @internal
 */
export type ConverterValue = `${Converters}`;

/**
 * Valid array element converter types (excludes array, json, regexp)
 * @internal
 */
export type ArrayElementConverter = Exclude<Converters, Converters.Array | Converters.Json | Converters.Regexp>;

/**
 * Type alias for array element converter values
 * @internal
 */
export type ArrayElementConverterValue = `${ArrayElementConverter}`;
