// the ./converters barrel imports ValueConverter, which imports this file
import { isArrayOf } from '../converters/Converters';
import { ListOfBuiltInConverters, BuiltInConverterTypeCheckers } from '../converters/ListOfBuiltInConverters';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { ArrayOf } from '../converters/Converters';
import type { EnvFileOptions } from '../infra/Dotenv';
import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type { BuiltInConverter, ConverterFunction, EnvaptConverter, FileApiMode } from '../types';

const CONSTRUCTOR_NAMES = new Map<unknown, string>([
    [String, 'String'],
    [Number, 'Number'],
    [Boolean, 'Boolean'],
    [BigInt, 'BigInt']
]);

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
        // arktype types are functions
        if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
        if (!('~standard' in value)) return false;
        const slot = value['~standard'];
        if (typeof slot !== 'object' || slot === null) return false;
        const props = slot as { version?: unknown; validate?: unknown };
        return props.version === 1 && typeof props.validate === 'function';
    }

    static rejectNonConverter(converter: unknown): void {
        // an arktype type is callable and returns ArkErrors for a bad value
        if (Validator.isStandardSchema(converter)) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                'A Standard Schema cannot be the `converter` on @Envapt. Pass it as `schema`.'
            );
        }
        Validator.rejectConstructor(converter);
    }

    static rejectConstructor(converter: unknown): void {
        // Symbol(raw) returns a new symbol on every read
        if (converter === Symbol) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                'Symbol is no longer a converter. Read the string and pass it to `Symbol.for()` yourself, like `Symbol.for(Envapter.get(key, fallback))`.'
            );
        }
        const name = CONSTRUCTOR_NAMES.get(converter);
        if (name !== undefined) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                `${name} is no longer a converter. Use \`Converters.${name}\`.`
            );
        }
    }

    static customConvertor<TFallback>(
        converter: EnvaptConverter<TFallback>
    ): asserts converter is ConverterFunction<TFallback> {
        Validator.rejectNonConverter(converter);
        if (typeof converter === 'string') {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidBuiltInConverter,
                `"${converter}" is not a valid converter type. Valid types are: ${ListOfBuiltInConverters.join(',')}`
            );
        }
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
        Validator.rejectConstructor(elementOf);
        const isScalar = typeof elementOf === 'string' && ListOfBuiltInConverters.includes(elementOf);
        const isSchema = Validator.isStandardSchema(elementOf);
        const isCustomFn = typeof elementOf === 'function' && !isSchema;
        if (!isScalar && !isCustomFn) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidArrayConverterType,
                `ArrayOf<...> element ("of") must be a built-in scalar token or a function, got ${isSchema ? 'a Standard Schema' : typeof elementOf}`
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

    // a truthy typo like 'true' or 1 would turn the mirror on
    static validateSyncProcessEnv(value: unknown): asserts value is boolean {
        if (typeof value !== 'boolean') {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                `Envapter.syncProcessEnv must be a boolean, got ${typeof value}.`
            );
        }
    }

    static validateEnvironment(value: unknown): asserts value is string {
        if (typeof value !== 'string') {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                `Envapter.environment must be a string, got ${typeof value}.`
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
