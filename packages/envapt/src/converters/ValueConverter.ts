import { BuiltInConverters } from './BuiltInConverters';
import { state } from '../core/state';
import { Validator } from '../engine/Validators';
import { debugVerbose, debugWarn } from '../infra/Debug';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { formatKeyForError } from '../infra/failures';

import type { ArrayOf } from './Converters';
import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type {
    BuiltInConverter,
    EnvKeyInput,
    EnvaptConverter,
    PresentValue,
    PrimitiveConstructor,
    RequiredField
} from '../types';
import type { EnvapterService } from '../types/Env';

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export class ValueConverter {
    constructor(private readonly envService: EnvapterService) {}

    convertValue<TFallback>(
        key: EnvKeyInput,
        fallback: TFallback | undefined,
        converter: EnvaptConverter<TFallback> | undefined,
        hasFallback: boolean
    ): TFallback | undefined {
        const resolvedConverter = this.resolveConverter(converter, fallback);
        const processedFallback = this.processFallbackForConverter(resolvedConverter, fallback);

        if (Validator.isArrayConverter(resolvedConverter)) {
            return this.processArrayConverter(key, processedFallback, resolvedConverter, hasFallback);
        }

        if (Validator.isPrimitiveConstructor(resolvedConverter)) {
            const stringConverter = this.convertPrimitiveToString(resolvedConverter);
            return this.processBuiltInConverter(key, processedFallback, stringConverter, hasFallback, true);
        }

        if (Validator.isBuiltInConverter(resolvedConverter)) {
            return this.processBuiltInConverter(key, processedFallback, resolvedConverter, hasFallback, false);
        }

        return this.processCustomConverter(key, processedFallback, resolvedConverter, hasFallback);
    }

    private processFallbackForConverter<TFallback>(
        converter: EnvaptConverter<TFallback>,
        fallback: TFallback | undefined
    ): TFallback | undefined {
        if (Validator.isPrimitiveConstructor(converter) && fallback !== undefined) {
            return Validator.coercePrimitiveFallback<TFallback>(converter, fallback);
        }
        return fallback;
    }

    private convertPrimitiveToString(primitiveConstructor: PrimitiveConstructor): BuiltInConverter {
        if (primitiveConstructor === String) return 'string';
        if (primitiveConstructor === Number) return 'number';
        if (primitiveConstructor === Boolean) return 'boolean';
        if (primitiveConstructor === BigInt) return 'bigint';
        /* v8 ignore next -- @preserve */
        if (primitiveConstructor === Symbol) return 'symbol';

        /* v8 ignore next -- @preserve */
        throw new EnvaptError(EnvaptErrorCodes.InvalidConverterType, `Unknown primitive constructor`);
    }

    private processBuiltInConverter<TFallback>(
        key: EnvKeyInput,
        fallback: TFallback | undefined,
        resolvedConverter: BuiltInConverter,
        hasFallback: boolean,
        wasOriginallyConstructor: boolean
    ): TFallback | undefined {
        Validator.builtInConverter(resolvedConverter);

        if (hasFallback && !wasOriginallyConstructor) {
            Validator.validateBuiltInConverterFallback(resolvedConverter, fallback);
        }

        const parsed = this.envService.get(key, undefined);

        if (parsed === undefined) {
            if (!hasFallback) return undefined;
            // time returns a number even when the fallback is a string
            if (resolvedConverter === 'time' && typeof fallback === 'string') {
                const timeFn = BuiltInConverters.getConverter(resolvedConverter);
                return timeFn('', fallback) as TFallback;
            }
            return fallback;
        }

        const converterFn = BuiltInConverters.getConverter(resolvedConverter);
        const converted = converterFn(parsed, undefined);

        if (converted === undefined) {
            // leave the value out because env values can be secrets
            debugVerbose(
                `could not convert ${formatKeyForError(key)} as ${resolvedConverter}${hasFallback ? ', using the fallback' : ''}`
            );
            // time needs the real fallback to turn a string fallback into a number
            return hasFallback ? (converterFn(parsed, fallback) as TFallback) : undefined;
        }

        return converted as TFallback;
    }

    private processArrayConverter<TFallback>(
        key: EnvKeyInput,
        fallback: TFallback | undefined,
        resolvedConverter: ArrayOf,
        hasFallback: boolean
    ): TFallback | undefined {
        Validator.arrayConverter(resolvedConverter);

        if (hasFallback && !Array.isArray(fallback)) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidFallback,
                `ArrayOf<...> requires that the fallback be an array, got ${typeof fallback}`
            );
        }

        if (hasFallback && Array.isArray(fallback)) {
            Validator.validateArrayFallbackElementTypes(fallback);
            Validator.validateArrayConverterElementTypeMatch(resolvedConverter.of, fallback);
        }

        const parsed = this.envService.get(key, undefined);

        if (parsed === undefined) {
            if (!hasFallback) return undefined;
            // a time array returns number[] even when its fallback holds strings
            if (
                resolvedConverter.of === 'time' &&
                Array.isArray(fallback) &&
                fallback.every((v) => typeof v === 'string')
            ) {
                const timeFn = BuiltInConverters.getConverter('time');
                return fallback.map((v) => timeFn('', v as string)) as TFallback;
            }
            return fallback;
        }

        const result = BuiltInConverters.processArrayConverter(parsed, resolvedConverter, state.strict);
        return result as TFallback;
    }

    private processCustomConverter<TFallback>(
        key: EnvKeyInput,
        fallback: TFallback | undefined,
        resolvedConverter: EnvaptConverter<TFallback>,
        _hasFallback: boolean // unused. the custom converter runs even when raw is undefined
    ): TFallback | undefined {
        Validator.customConvertor(resolvedConverter);

        const raw = this.envService.get(key, undefined);

        return resolvedConverter(raw, fallback);
    }

    private resolveConverter<TFallback>(
        converter: EnvaptConverter<TFallback> | undefined,
        fallback: TFallback | undefined
    ): EnvaptConverter<TFallback> {
        if (converter) return converter;

        const fallbackType = typeof fallback;
        if (fallbackType === 'number') return 'number';
        if (fallbackType === 'boolean') return 'boolean';
        if (fallbackType === 'bigint') return 'bigint';
        if (fallbackType === 'symbol') return 'symbol';
        return 'string';
    }

    readPresent({ key, value }: PresentValue, field: RequiredField): StandardSchemaV1.Result<unknown> {
        const outcome = Validator.isStandardSchema(field)
            ? this.runSchema(key, field, value)
            : this.runParser(value, this.requiredParser(field));
        if (outcome.issues === undefined) return outcome;

        const issues = outcome.issues.length > 0 ? outcome.issues : [{ message: 'no issue message' }];
        return { issues: issues.map((issue) => ({ message: issue.message, path: [key, ...(issue.path ?? [])] })) };
    }

    private runParser(value: string, parse: (raw: string) => unknown): StandardSchemaV1.Result<unknown> {
        let converted: unknown;
        try {
            converted = parse(value);
        } catch (error) {
            return { issues: [{ message: errorMessage(error) }] };
        }
        if (converted === undefined || converted === null) return { issues: [{ message: 'could not be converted' }] };
        return { value: converted };
    }

    // a bad spec entry has to throw outside runParser's try
    private requiredParser(field: Exclude<RequiredField, StandardSchemaV1>): (raw: string) => unknown {
        // safe to widen a `raw: string` parser because it only gets a present value
        const converter = (
            Validator.isPrimitiveConstructor(field) ? this.convertPrimitiveToString(field) : field
        ) as EnvaptConverter<unknown>;
        if (Validator.isArrayConverter(converter)) {
            Validator.arrayConverter(converter);
            return (raw) => BuiltInConverters.processArrayConverter(raw, converter, state.strict);
        }
        if (Validator.isBuiltInConverter(converter)) {
            const convert = BuiltInConverters.getConverter(converter);
            return (raw) => convert(raw, undefined);
        }
        Validator.customConvertor(converter);
        return converter;
    }

    private runSchema(
        key: EnvKeyInput,
        schema: StandardSchemaV1,
        raw: string | undefined
    ): StandardSchemaV1.Result<unknown> {
        let outcome: StandardSchemaV1.Result<unknown> | Promise<StandardSchemaV1.Result<unknown>>;
        try {
            outcome = schema['~standard'].validate(raw);
        } catch (cause) {
            throw new EnvaptError(
                EnvaptErrorCodes.SchemaThrew,
                `Schema for "${formatKeyForError(key)}" threw during validation: ${errorMessage(cause)}`,
                { cause }
            );
        }

        if (outcome instanceof Promise) {
            // node crashes on an unhandled rejection
            outcome.catch((reason: unknown) => {
                debugWarn(`schema for ${formatKeyForError(key)} rejected: ${errorMessage(reason)}`);
            });
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                `Schema for "${formatKeyForError(key)}" returned a Promise. envapt requires a synchronous schema. zod also returns a Promise when a transform or refine throws. Set Envapter.debug to 'warn' to log that error.`
            );
        }

        return outcome;
    }
}
