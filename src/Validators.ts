import fs from 'node:fs';

import { EnvaptError, EnvaptErrorCodes } from './Error';
import { ListOfBuiltInConverters, BuiltInConverterTypeCheckers } from './ListOfBuiltInConverters';

import type {
  ArrayConverter,
  BuiltInConverter,
  ConverterFunction,
  EnvaptConverter,
  PermittedDotenvConfig,
  ValidArrayConverterBuiltInType
} from './Types';

export class Validator {
  /**
   * Check if a value is a built-in converter type
   */
  static isBuiltInConverter<FallbackType>(value: EnvaptConverter<FallbackType>): value is BuiltInConverter {
    if (typeof value === 'string') return ListOfBuiltInConverters.includes(value);
    return false;
  }

  /**
   * Check if a value is an ArrayConverter configuration object
   */
  static isArrayConverter(value: unknown): value is ArrayConverter {
    return (
      typeof value === 'object' &&
      value !== null &&
      'delimiter' in value &&
      typeof (value as ArrayConverter).delimiter === 'string'
    );
  }

  /**
   * Check if a value is a valid ArrayConverter type
   */
  static isValidArrayConverterType(value: unknown): value is ValidArrayConverterBuiltInType {
    if (typeof value !== 'string') return false;

    const invalidTypes = ['array', 'json', 'regexp'];

    if (invalidTypes.includes(value)) return false;
    const validTypes: ValidArrayConverterBuiltInType[] = ListOfBuiltInConverters.filter(
      (type): type is ValidArrayConverterBuiltInType => !invalidTypes.includes(type)
    );

    return validTypes.includes(value as ValidArrayConverterBuiltInType);
  }

  static customConvertor<FallbackType>(
    converter: EnvaptConverter<FallbackType>
  ): asserts converter is ConverterFunction<FallbackType> {
    if (typeof converter !== 'function') {
      throw new EnvaptError(
        EnvaptErrorCodes.InvalidCustomConverter,
        `Custom converter must be a function, got ${typeof converter}.`
      );
    }
  }

  /**
   * Validate ArrayConverter configuration with runtime checks
   */
  static arrayConverter(value: unknown): asserts value is ArrayConverter {
    if (!this.isArrayConverter(value)) {
      throw new EnvaptError(EnvaptErrorCodes.MissingDelimiter, 'Must have delimiter property');
    }

    if (value.type !== undefined && !this.isValidArrayConverterType(value.type)) {
      throw new EnvaptError(
        EnvaptErrorCodes.InvalidArrayConverterType,
        `"${value.type as string}" is not a valid converter type`
      );
    }
  }

  /**
   * Validate that a string is a valid built-in converter type
   */
  static builtInConverter(value: unknown): asserts value is BuiltInConverter {
    if (typeof value !== 'string') {
      throw new EnvaptError(EnvaptErrorCodes.InvalidConverterType, `Expected string, got ${typeof value}`);
    }

    if (!ListOfBuiltInConverters.includes(value as BuiltInConverter)) {
      throw new EnvaptError(
        EnvaptErrorCodes.InvalidBuiltInConverter,
        `"${value}" is not a valid converter type. Valid types are: ${ListOfBuiltInConverters.join(',')}`
      );
    }
  }

  /**
   * Validate that fallback type matches the converter's return type for built-in converters
   */
  static validateBuiltInConverterFallback(converter: BuiltInConverter, fallback: unknown): void {
    if (fallback === undefined) return; // No fallback to validate

    const typeChecker = BuiltInConverterTypeCheckers[converter];
    if (!typeChecker(fallback)) {
      throw new EnvaptError(
        EnvaptErrorCodes.FallbackConverterTypeMismatch,
        `Fallback type does not match converter "${converter}". Expected ${converter} compatible type.`
      );
    }
  }

  /**
   * Validate that all elements in an array fallback have consistent types
   */
  static validateArrayFallbackElementTypes(fallback: unknown[]): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (fallback && fallback.length === 0) return; // Empty array is valid

    const firstElementType = typeof fallback[0];
    const hasInconsistentTypes = fallback.some((element, index) => {
      if (index === 0) return false; // Skip first element
      return typeof element !== firstElementType;
    });

    if (hasInconsistentTypes) {
      throw new EnvaptError(
        EnvaptErrorCodes.ArrayFallbackElementTypeMismatch,
        `All elements in array fallback must have the same type. Found mixed types.`
      );
    }
  }

  /**
   * Validate that array converter type matches fallback element types
   */
  static validateArrayConverterElementTypeMatch(converterType: string, fallback: unknown[]): void {
    if (fallback.length === 0) return; // Empty array is valid

    const firstElement = fallback[0];
    const typeChecker = BuiltInConverterTypeCheckers[converterType as keyof typeof BuiltInConverterTypeCheckers];

    if (!typeChecker(firstElement)) {
      throw new EnvaptError(
        EnvaptErrorCodes.ArrayFallbackElementTypeMismatch,
        `Array converter type "${converterType}" does not match fallback element type. Expected ${converterType} compatible elements.`
      );
    }
  }

  /**
   * Check if a value is a primitive constructor
   */
  static isPrimitiveConstructor(
    value: unknown
  ): value is typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol {
    return value === String || value === Number || value === Boolean || value === BigInt || value === Symbol;
  }

  /**
   * Safely coerce a fallback value using a primitive constructor
   */
  static coercePrimitiveFallback<CoercedType>(
    converter: typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol,
    fallback: unknown
  ): CoercedType {
    // Check if fallback is already the correct type and return as-is
    if (this.isCorrectPrimitiveType(converter, fallback)) return fallback as CoercedType;

    // Otherwise, coerce the value
    return this.performPrimitiveCoercion<CoercedType>(converter, fallback);
  }

  /**
   * Check if fallback is already the correct primitive type
   */
  private static isCorrectPrimitiveType(
    converter: typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol,
    fallback: unknown
  ): boolean {
    if (converter === String && typeof fallback === 'string') return true;
    if (converter === Number && typeof fallback === 'number') return true;
    if (converter === Boolean && typeof fallback === 'boolean') return true;
    if (converter === BigInt && typeof fallback === 'bigint') return true;
    if (converter === Symbol && typeof fallback === 'symbol') return true;
    return false;
  }

  /**
   * Perform the actual primitive coercion
   */
  private static performPrimitiveCoercion<CoercedType>(
    converter: typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol,
    fallback: unknown
  ): CoercedType {
    try {
      if (converter === String) return String(fallback) as CoercedType;
      if (converter === Number) return Number(fallback) as CoercedType;
      if (converter === Boolean) return Boolean(fallback) as CoercedType;
      if (converter === BigInt) return BigInt(fallback as string | number | bigint) as CoercedType;
      if (converter === Symbol) return Symbol(fallback as string | number) as CoercedType;
    } catch (error) {
      throw new EnvaptError(
        EnvaptErrorCodes.PrimitiveCoercionFailed,
        `Failed to coerce fallback value using ${converter.name}: ${(error as Error).message}`
      );
    }

    // This should never happen but TypeScript needs it
    throw new EnvaptError(EnvaptErrorCodes.PrimitiveCoercionFailed, `Unknown primitive converter: ${converter.name}`);
  }

  /**
   * Make sure the user hasn't provided prohibited options in their dotenv config
   */
  static validateDotenvConfig(config: Record<string, unknown>): config is PermittedDotenvConfig {
    if ('path' in config || 'processEnv' in config) {
      throw new EnvaptError(
        EnvaptErrorCodes.InvalidUserDefinedConfig,
        'Custom dotenvConfig should not include "path" or "processEnv" options. Those are managed by Envapter.'
      );
    }

    const validKeys = new Set(['encoding', 'quiet', 'debug', 'override', 'DOTENV_KEY']);
    const invalidKeys = Object.keys(config).filter((key) => !validKeys.has(key));

    if (invalidKeys.length > 0) {
      throw new EnvaptError(
        EnvaptErrorCodes.InvalidUserDefinedConfig,
        `Invalid dotenvConfig options: ${invalidKeys.join(', ')}. Allowed options: ${Array.from(validKeys).join(', ')}`
      );
    }

    return true;
  }

  /**
   * Check if each provided path resolves to an env file by trying to access it
   */
  static validateEnvFilesExist(paths: string[]): void {
    const missing = paths.filter((p) => {
      try {
        fs.accessSync(p, fs.constants.F_OK);
        return false;
      } catch {
        return true;
      }
    });

    if (missing.length > 0) {
      throw new EnvaptError(
        EnvaptErrorCodes.EnvFilesNotFound,
        `Environment file not found at path: ${missing.join(', ')}`
      );
    }
  }
}
