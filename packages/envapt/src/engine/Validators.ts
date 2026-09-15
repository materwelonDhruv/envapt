// the ./converters barrel imports ValueConverter, which imports this file
import { isArrayOf } from '../converters/Converters';
import { ListOfBuiltInConverters, BuiltInConverterTypeCheckers } from '../converters/ListOfBuiltInConverters';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { ArrayOf, ConverterToken } from '../converters/Converters';
import type { EnvFileOptions } from '../infra/Dotenv';
import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type { BuiltInConverter, ConverterFunction, EnvaptConverter, FileApiMode } from '../types';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- cohesive dispatch of stateless type guards, same shape as BuiltInConverters
export class Validator {
    static isBuiltInConverter<TFallback>(value: EnvaptConverter<TFallback>): value is BuiltInConverter {
        if (typeof value === 'string') return ListOfBuiltInConverters.includes(value);
        return false;
    }

    static isArrayConverter(value: unknown): value is ArrayOf {
        return isArrayOf(value);
    }

    static isStandardSchema(value: unknown): value is StandardSchemaV1 {
        if (typeof value !== 'object' || value === null) return false;
        if (!('~standard' in value)) return false;
        const slot = value['~standard'];
        if (typeof slot !== 'object' || slot === null) return false;
        const props = slot as { version?: unknown; validate?: unknown };
        return props.version === 1 && typeof props.validate === 'function';
    }

    static customConvertor<TFallback>(
        converter: EnvaptConverter<TFallback>
    ): asserts converter is ConverterFunction<TFallback> {
        if (typeof converter !== 'function') {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidCustomConverter,
                `Custom converter must be a function, got ${typeof converter}.`
            );
        }
    }

    static arrayConverter(value: unknown): asserts value is ArrayOf {
        if (!isArrayOf(value)) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidArrayConverterType,
                'Expected an ArrayOf<...> token produced by Converters.array(...)'
            );
        }

        if (typeof value.delimiter !== 'string' || value.delimiter.length === 0) {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingDelimiter,
                `ArrayOf<...> requires a non-empty string delimiter, got ${typeof value.delimiter}`
            );
        }

        const elementOf = value.of;
        const isScalar = typeof elementOf === 'string' && ListOfBuiltInConverters.includes(elementOf);
        const isCustomFn = typeof elementOf === 'function';
        if (!isScalar && !isCustomFn) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidArrayConverterType,
                `ArrayOf<...> element ("of") must be a built-in scalar token or a function, got ${typeof elementOf}`
            );
        }
    }

    static builtInConverter(value: unknown): asserts value is BuiltInConverter {
        if (typeof value !== 'string') {
            throw new EnvaptError(EnvaptErrorCodes.InvalidConverterType, `Expected string, got ${typeof value}`);
        }

        if (!ListOfBuiltInConverters.includes(value as ConverterToken)) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidBuiltInConverter,
                `"${value}" is not a valid converter type. Valid types are: ${ListOfBuiltInConverters.join(',')}`
            );
        }
    }

    static validateBuiltInConverterFallback(converter: BuiltInConverter, fallback: unknown): void {
        const typeChecker = BuiltInConverterTypeCheckers[converter];
        if (!typeChecker(fallback)) {
            throw new EnvaptError(
                EnvaptErrorCodes.FallbackConverterTypeMismatch,
                `Fallback type does not match converter "${converter}". Expected ${converter} compatible type.`
            );
        }
    }

    static validateArrayFallbackElementTypes(fallback: unknown[]): void {
        if (fallback.length === 0) return;

        const firstElementType = typeof fallback[0];
        const hasInconsistentTypes = fallback.some((element, index) => {
            if (index === 0) return false;
            return typeof element !== firstElementType;
        });

        if (hasInconsistentTypes) {
            throw new EnvaptError(
                EnvaptErrorCodes.ArrayFallbackElementTypeMismatch,
                `All elements in array fallback must have the same type. Found mixed types.`
            );
        }
    }

    static validateArrayConverterElementTypeMatch(elementOf: ArrayOf['of'], fallback: unknown[]): void {
        if (fallback.length === 0) return;

        if (typeof elementOf === 'function') {
            // a custom element converter can return any type
            return;
        }

        const elementToken = elementOf;

        if (elementToken === 'time') {
            const everyNumber = fallback.every((v) => typeof v === 'number');
            const everyString = fallback.every((v) => typeof v === 'string');
            if (!everyNumber && !everyString) {
                throw new EnvaptError(
                    EnvaptErrorCodes.ArrayFallbackElementTypeMismatch,
                    'Time array fallback must be all numbers or all time-string entries.'
                );
            }
            return;
        }

        const typeChecker = BuiltInConverterTypeCheckers[elementToken];
        const firstElement = fallback[0];
        if (!typeChecker(firstElement)) {
            throw new EnvaptError(
                EnvaptErrorCodes.ArrayFallbackElementTypeMismatch,
                `Array converter type "${elementToken}" does not match fallback element type. Expected ${elementToken} compatible elements.`
            );
        }
    }

    static isPrimitiveConstructor(
        value: unknown
    ): value is typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol {
        return value === String || value === Number || value === Boolean || value === BigInt || value === Symbol;
    }

    static coercePrimitiveFallback<CoercedType>(
        converter: typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol,
        fallback: unknown
    ): CoercedType {
        if (this.isCorrectPrimitiveType(converter, fallback)) return fallback as CoercedType;
        return this.performPrimitiveCoercion<CoercedType>(converter, fallback);
    }

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

    private static performPrimitiveCoercion<CoercedType>(
        converter: typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol,
        fallback: unknown
    ): CoercedType {
        try {
            if (converter === String) return String(fallback) as CoercedType;
            if (converter === Number) return Number(fallback) as CoercedType;
            if (converter === Boolean) return Boolean(fallback) as CoercedType;
            if (converter === BigInt) return BigInt(fallback as string | number | bigint) as CoercedType;
            /* v8 ignore next -- @preserve */
            if (converter === Symbol) return Symbol.for(String(fallback)) as CoercedType;
        } catch (error) {
            throw new EnvaptError(
                EnvaptErrorCodes.PrimitiveCoercionFailed,
                `Failed to coerce fallback value using ${converter.name}: ${(error as Error).message}`
            );
        }

        /* v8 ignore next -- @preserve */
        throw new EnvaptError(
            EnvaptErrorCodes.PrimitiveCoercionFailed,
            `Unknown primitive converter: ${converter.name}`
        );
    }

    // a truthy typo like 'true' or 1 would turn the mirror on
    static validateSyncProcessEnv(value: unknown): asserts value is boolean {
        if (typeof value !== 'boolean') {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                `Envapter.syncProcessEnv must be a boolean, got ${typeof value}.`
            );
        }
    }

    static validateFileApiMode(value: unknown): asserts value is FileApiMode {
        if (value !== 'warn' && value !== 'throw') {
            const got = typeof value === 'string' ? `'${value}'` : typeof value;
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                `Envapter.fileApiMode must be 'warn' or 'throw', got ${got}.`
            );
        }
    }

    static validateEnvFileOptions(config: object): config is EnvFileOptions {
        const validKeys = new Set(['encoding', 'override']);
        const invalidKeys = Object.keys(config).filter((key) => !validKeys.has(key));

        if (invalidKeys.length > 0) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                `Invalid envFileOptions: ${invalidKeys.join(', ')}. Allowed options: ${Array.from(validKeys).join(', ')}. For debug output, use Envapter.debug or the ENVAPT_DEBUG env var.`
            );
        }

        return true;
    }

    // fileExists comes from the caller because this file must not import node:fs
    static validateEnvFilesExist(paths: string[], fileExists: (path: string) => boolean): void {
        const missing = paths.filter((p) => !fileExists(p));

        if (missing.length > 0) {
            throw new EnvaptError(
                EnvaptErrorCodes.EnvFilesNotFound,
                `Environment file not found at path: ${missing.join(', ')}`
            );
        }
    }
}
