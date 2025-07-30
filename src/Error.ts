export const EnvaptErrorCodes = {
  InvalidFallback: 617404,
  MissingDelimiter: 967308,
  InvalidArrayConverterType: 193159,
  InvalidBuiltInConverter: 337271,
  InvalidConverterType: 453217,
  InvalidCustomConverter: 789432
} as const;

export type EnvaptErrorCode = (typeof EnvaptErrorCodes)[keyof typeof EnvaptErrorCodes];

const ReversedEnvaptErrorCodes = Object.fromEntries(
  Object.entries(EnvaptErrorCodes).map(([key, value]) => [value, key])
) as Record<EnvaptErrorCode, string>;

export class EnvaptError extends Error {
  public readonly code: EnvaptErrorCode;

  constructor(code: EnvaptErrorCode, message: string) {
    super(message);
    this.name = `${ReversedEnvaptErrorCodes[code]} [${code}]`;
    this.code = code;

    Error.captureStackTrace(this, EnvaptError);
  }
}
