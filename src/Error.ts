/* eslint-disable no-magic-numbers */
export enum EnvaptErrorCodes {
    // Fallback related errors
    /** Thrown when an invalid fallback value is provided */
    InvalidFallback = 101,
    /** Thrown when fallback value type doesn't match expected converter type */
    InvalidFallbackType = 102,
    /** Thrown when array fallback contains elements of wrong type */
    ArrayFallbackElementTypeMismatch = 103,
    /** Thrown when fallback type doesn't match the specified converter */
    FallbackConverterTypeMismatch = 104,

    // Converter related errors
    /** Thrown when invalid array converter configuration is provided */
    InvalidArrayConverterType = 201,
    /** Thrown when an invalid built-in converter is specified */
    InvalidBuiltInConverter = 202,
    /** Thrown when a custom converter is not a function */
    InvalidCustomConverter = 203,
    /** Thrown when converter type is not recognized */
    InvalidConverterType = 204,
    /** Thrown when primitive type coercion on fallback value fails */
    PrimitiveCoercionFailed = 205,

    // Other errors
    /** Thrown when delimiter is missing in array converter configuration */
    // This doesn't happen because 203 is thrown when object without delimiter is passed
    MissingDelimiter = 301,
    /** Thrown when invalid user-defined configuration is provided */
    InvalidUserDefinedConfig = 302,
    /** Thrown when specified environment files don't exist */
    EnvFilesNotFound = 303
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
    }
}
