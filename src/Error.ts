/* eslint-disable no-magic-numbers */
export enum EnvaptErrorCodes {
  InvalidFallback = 617404,
  MissingDelimiter = 967308,
  InvalidArrayConverterType = 193159,
  InvalidBuiltInConverter = 337271,
  InvalidConverterType = 453217,
  InvalidCustomConverter = 789432,
  FailedToResolveConverter = 545789
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
