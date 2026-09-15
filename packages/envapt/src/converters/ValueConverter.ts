import { BuiltInConverters } from './BuiltInConverters';
import { state } from '../core/state';
import { Validator } from '../engine/Validators';
import { debugVerbose } from '../infra/Debug';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { ArrayOf } from './Converters';
import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type { BuiltInConverter, EnvKeyInput, EnvaptConverter, PrimitiveConstructor } from '../types';
import type { EnvapterService } from '../types/Env';

function formatKeyForError(key: EnvKeyInput): string {
    return Array.isArray(key) ? `[${key.join(', ')}]` : String(key);
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

    // the decorators and `Envapter.parse()` both run schema reads through here
    convertWithSchema(key: EnvKeyInput, schema: StandardSchemaV1, fallback: unknown, hasFallback: boolean): unknown {
        const raw = this.envService.get(key, undefined);

        if (raw === undefined) {
            if (hasFallback) return fallback;
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Required environment variable "${formatKeyForError(key)}" is missing or empty.`
            );
        }

        let outcome: StandardSchemaV1.Result<unknown> | Promise<StandardSchemaV1.Result<unknown>>;
        try {
            outcome = schema['~standard'].validate(raw);
        } catch (cause) {
            throw new EnvaptError(
                EnvaptErrorCodes.SchemaThrew,
                `Schema for "${formatKeyForError(key)}" threw during validation: ${(cause as Error).message}`,
                { cause }
            );
        }

        if (outcome instanceof Promise) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                `Schema for "${formatKeyForError(key)}" returned a Promise. envapt requires synchronous schemas; use a sync validator or perform async checks outside the env layer.`
            );
        }

        if (outcome.issues !== undefined) {
            const first = outcome.issues[0];
            const firstMessage = first?.message ?? 'no issue message';
            throw new EnvaptError(
                EnvaptErrorCodes.SchemaValidationFailed,
                `Schema validation failed for "${formatKeyForError(key)}": ${firstMessage}`,
                { issues: outcome.issues }
            );
        }

        return outcome.value;
    }
}
