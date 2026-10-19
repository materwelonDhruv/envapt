import type { StandardSchemaV1 } from './StandardSchema';

/**
 * Numeric codes carried by {@link EnvaptError.code}. The hundreds digit groups them by failure:
 * 1xx for fallbacks, 2xx for conversion and validation, 3xx for configuration and lookup.
 * @see {@link https://envapt.materwelon.dev/docs/errors#codes}
 */
export const EnvaptErrorCodes = {
    /** Thrown when an array converter gets a fallback that is not an array. */
    InvalidFallback: 101,
    /**
     * Thrown when an array fallback mixes element types, or its elements do not match the array's
     * element converter.
     */
    ArrayFallbackElementTypeMismatch: 103,
    /** Thrown when a fallback does not match the type its built-in converter returns. */
    FallbackConverterTypeMismatch: 104,
    /** Thrown when a time-string fallback does not match the `<number><unit>` format. */
    MalformedTimeFallback: 105,

    /**
     * Thrown when an array converter is not a `Converters.array()` token, or its `of` is neither a
     * built-in scalar nor a function.
     */
    InvalidArrayConverterType: 201,
    /** Thrown when a converter string is not one of the built-in tokens. */
    InvalidBuiltInConverter: 202,
    /** Thrown when a converter is neither a built-in token nor a function. */
    InvalidCustomConverter: 203,
    /** Thrown when an array element fails to convert to the array's element type. */
    ArrayElementConversionFailed: 206,
    /** Thrown in strict mode when an array element is empty or whitespace only. */
    EmptyArrayElement: 207,
    /** Thrown when `getAs` or `@Envapt({ schema })` without `required` reads a value its Standard Schema rejects. */
    SchemaValidationFailed: 208,
    /**
     * Thrown when a Standard Schema's `validate` throws in `getAs` or `@Envapt({ schema })` without `required`.
     * A required read reports it as an `InvalidEnvValue` issue.
     */
    SchemaThrew: 209,
    /**
     * Thrown when a required read gets a value it can't convert, a bad array element, or an error from a custom
     * parser or schema. `getRequiredAll` throws it once for all bad values, schema fields included.
     */
    InvalidEnvValue: 210,

    /** Thrown when an array converter's delimiter is missing or an empty string. */
    MissingDelimiter: 301,
    /** Thrown when an option or setting has an invalid value, or combines options that cannot go together. */
    InvalidUserDefinedConfig: 302,
    /** Thrown when a listed env file does not exist. */
    EnvFilesNotFound: 303,
    /** Thrown when the key list is empty, or a key is not a string or is blank. */
    InvalidKeyInput: 304,
    /** Thrown when a required value is missing or empty, or in strict mode when a `${VAR}` can't resolve. */
    MissingEnvValue: 305,
    /**
     * Thrown when a file API such as `envPaths` or `baseDir` runs on a source without files, or on the
     * portable build with `fileApiMode = 'throw'`.
     */
    FileApiUnsupported: 306,
    /** Thrown when an environment value is read before a source is bound with `Envapter.useSource`. */
    NoSourceBound: 307,
    /** Thrown when `merge` is called with no members, or with more than one filesystem-backed source. */
    InvalidMergedSource: 308
} as const;

/**
 * One of the numeric {@link EnvaptErrorCodes} values, such as `210`.
 * @public
 */
export type EnvaptErrorCodes = (typeof EnvaptErrorCodes)[keyof typeof EnvaptErrorCodes];

interface EnvaptErrorOptions {
    issues?: readonly StandardSchemaV1.Issue[];
    cause?: unknown;
}

/**
 * The error envapt throws. Its `code` identifies the failure.
 *
 * @example
 * ```ts
 * try {
 *   Envapter.require('DATABASE_URL', 'SESSION_SECRET');
 * } catch (error) {
 *   if (error instanceof EnvaptError && error.code === EnvaptErrorCodes.MissingEnvValue) {
 *     console.error(error.message);
 *     process.exit(1);
 *   }
 *   throw error;
 * }
 * ```
 * @see {@link https://envapt.materwelon.dev/docs/errors#the-error-shape}
 */
export class EnvaptError extends Error {
    /** The {@link EnvaptErrorCodes} value identifying what failed. */
    public readonly code: EnvaptErrorCodes;
    /**
     * Populated only for {@link EnvaptErrorCodes.SchemaValidationFailed} (208) and
     * {@link EnvaptErrorCodes.InvalidEnvValue} (210). For every other code this is `undefined`.
     */
    public readonly issues: readonly StandardSchemaV1.Issue[] | undefined;

    constructor(code: EnvaptErrorCodes, message: string, options?: EnvaptErrorOptions) {
        super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
        this.name = `EnvaptError [${code}]`;
        this.code = code;
        this.issues = options?.issues;
    }
}
