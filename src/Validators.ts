import { ListOfBuiltInConverters } from './BuiltInConverters';
import { EnvaptError, EnvaptErrorCodes } from './Error';

import type {
  EnvaptConverter,
  ConverterFunction,
  ArrayConverter,
  BuiltInConverter,
  ValidArrayConverterBuiltInType
} from './Types';

export class Validator {
  /**
   * Check if a value is a built-in converter type
   */
  static isBuiltInConverter(value: EnvaptConverter<unknown>): value is BuiltInConverter {
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
}
