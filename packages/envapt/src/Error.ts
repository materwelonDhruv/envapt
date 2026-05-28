/* eslint-disable no-magic-numbers */
import type { StandardSchemaV1 } from './StandardSchema';

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
    /** Thrown when a time-string fallback is malformed (does not match the required `<integer><unit>` format) */
    MalformedTimeFallback = 105,

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
    /** Thrown when an array element fails to convert to the configured element type */
    ArrayElementConversionFailed = 206,
    /** Thrown under strict mode when an array element is empty or whitespace only */
    EmptyArrayElement = 207,
    /** Thrown when a Standard Schema returns issues for a non-empty env value */
    SchemaValidationFailed = 208,
    /** Thrown when a Standard Schema's `validate` itself throws (e.g. a refinement that crashes) */
    SchemaThrew = 209,

    // Other errors
    /** Thrown when delimiter is missing in array converter configuration */
    // This doesn't happen because 203 is thrown when object without delimiter is passed
    MissingDelimiter = 301,
    /** Thrown when invalid user-defined configuration is provided */
    InvalidUserDefinedConfig = 302,
    /** Thrown when specified environment files don't exist */
    EnvFilesNotFound = 303,
    /** Thrown when no valid environment key is provided */
    InvalidKeyInput = 304,
    /** Thrown when a required environment value is missing or empty (post-trim) */
    MissingEnvValue = 305
}

interface EnvaptErrorOptions {
    issues?: readonly StandardSchemaV1.Issue[];
    cause?: unknown;
}

/**
 * Custom error for better DX and debugging when using Envapt.
 *
 * @example
 * ```ts
 * throw new EnvaptError(EnvaptErrorCodes.InvalidFallback, "Invalid fallback value provided for environment variable.");
 * ```
 */
export class EnvaptError extends Error {
    public readonly code: EnvaptErrorCodes;
    /**
     * Populated only for {@link EnvaptErrorCodes.SchemaValidationFailed} (208). For every other
     * code this is `undefined`. Lets callers do `if (err.code === 208) err.issues?.forEach(...)`
     * without a type cast.
     */
    public readonly issues: readonly StandardSchemaV1.Issue[] | undefined;

    constructor(code: EnvaptErrorCodes, message: string, options?: EnvaptErrorOptions) {
        super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
        this.name = `EnvaptError [${code}]`;
        this.code = code;
        this.issues = options?.issues;
    }
}
