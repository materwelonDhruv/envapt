/* eslint-disable no-magic-numbers */
export enum EnvaptErrorCodes {
  // Fallback related errors
  InvalidFallback = 101,
  InvalidFallbackType = 102,
  ArrayFallbackElementTypeMismatch = 103,
  FallbackConverterTypeMismatch = 104,

  // Converter related errors
  InvalidArrayConverterType = 201,
  InvalidBuiltInConverter = 202,
  InvalidCustomConverter = 203,
  InvalidConverterType = 204,
  PrimitiveCoercionFailed = 205,

  // Other errors
  // This doesn't happen because 789432 is thrown when object without delimiter is passed
  MissingDelimiter = 301
}

/**
 * Custom error for better DX and debugging when using Envapt.
 *
 * @example
 * ```ts
 * throw new EnvaptError(EnvaptErrorCode.InvalidFallback, "Invalid fallback value provided for environment variable.");
 * ```
 */
export class EnvaptError extends Error {
  public readonly code: EnvaptErrorCodes;

  constructor(code: EnvaptErrorCodes, message: string) {
    super(message);
    this.name = `EnvaptError [${code}]`;
    this.code = code;

    Error.captureStackTrace(this, EnvaptError);
  }
}
