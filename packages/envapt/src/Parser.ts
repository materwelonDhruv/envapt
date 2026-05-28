import { BuiltInConverters } from './BuiltInConverters';
import { EnvaptError, EnvaptErrorCodes } from './Error';
import { Validator } from './Validators';

import type { ArrayOf } from './Converters';
import type { BuiltInConverter, EnvKeyInput, EnvaptConverter, PrimitiveConstructor } from './Types';

/**
 * @internal
 */
export interface EnvapterService {
    getRaw(key: EnvKeyInput): string | undefined;
    get(key: EnvKeyInput, def?: string): string | undefined;
    isStrict(): boolean;
}

/**
 * Parser class for handling environment variable template resolution and type conversion
 * @internal
 */
export class Parser {
    private readonly TEMPLATE_REGEX = /\${\w*}/g;

    constructor(private readonly envService: EnvapterService) {}

    /**
     * Resolve template variables in a string while handling circular references and missing variables
     * @internal
     */
    resolveTemplate(key: string, value: string, stack: Set<string> = new Set<string>()): string {
        stack.add(key);
        const strict = this.envService.isStrict();

        const out = value.replace(this.TEMPLATE_REGEX, (template) => {
            const variable = template.slice(2, -1);

            if (stack.has(variable)) return template; // cycle, preserve

            const raw = this.envService.getRaw(variable);
            const isMissing = raw === undefined || raw === '' || (strict && raw.trim() === '');
            if (isMissing) {
                if (strict) {
                    throw new EnvaptError(
                        EnvaptErrorCodes.MissingEnvValue,
                        `Cannot resolve template variable "\${${variable}}": value is missing or empty.`
                    );
                }
                return template; // missing or empty, preserve
            }

            const resolved = this.resolveTemplate(variable, raw, new Set(stack));

            // If resolution still references the current key, skip replacement (indirect cycle)
            if (resolved.includes(`\${${key}}`)) return template;

            // If nothing changed (unresolved placeholders stayed), also preserve original template
            if (resolved === raw && /\$\{[^}]*\}/.test(resolved)) return template;

            return resolved;
        });

        stack.delete(key);
        return out;
    }

    convertValue<TFallback>(
        key: EnvKeyInput,
        fallback: TFallback | undefined,
        converter: EnvaptConverter<TFallback> | undefined,
        hasFallback: boolean
    ): TFallback | null | undefined {
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
    ): TFallback | null | undefined {
        Validator.builtInConverter(resolvedConverter);

        if (hasFallback && fallback !== undefined && !wasOriginallyConstructor) {
            Validator.validateBuiltInConverterFallback(resolvedConverter, fallback);
        }

        const parsed = this.envService.get(key, undefined);

        if (parsed === undefined) {
            if (!hasFallback) return null;
            // For converters with asymmetric fallback / return types — currently only `time`,
            // whose fallback may be a string while the return type is `number` — route the
            // fallback through the converter so it gets coerced to the return type.
            if (resolvedConverter === 'time' && typeof fallback === 'string') {
                const timeFn = BuiltInConverters.getConverter(resolvedConverter);
                return timeFn('', fallback) as TFallback;
            }
            return fallback;
        }

        const converterFn = BuiltInConverters.getConverter(resolvedConverter);
        const result = converterFn(parsed, fallback);

        if (result === undefined && !hasFallback) return null;

        return result as TFallback;
    }

    private processArrayConverter<TFallback>(
        key: EnvKeyInput,
        fallback: TFallback | undefined,
        resolvedConverter: ArrayOf,
        hasFallback: boolean
    ): TFallback | null | undefined {
        Validator.arrayConverter(resolvedConverter);

        if (hasFallback && fallback !== undefined && !Array.isArray(fallback)) {
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
            if (!hasFallback) return null;
            // When the array element is `time` and the fallback is a list of time-strings,
            // coerce each entry through the time converter so the returned array is
            // `number[]` matching the declared return type.
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

        const result = BuiltInConverters.processArrayConverter(parsed, resolvedConverter, this.envService.isStrict());
        return result as TFallback;
    }

    private processCustomConverter<TFallback>(
        key: EnvKeyInput,
        fallback: TFallback | undefined,
        resolvedConverter: EnvaptConverter<TFallback>,
        _hasFallback: boolean // hasFallback is not needed because customConverter is called even if the raw value is undefined
    ): TFallback | null | undefined {
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
}
