import { resolveKeyInput, templateResolver, valueConverter } from './engine';
import { hasFallback, isMissing } from './missing';
import { PrimitiveMethods } from './PrimitiveMethods';
import { debugWarn } from '../infra/Debug';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { recase } from '../infra/recase';

import type { ArrayOf } from '../converters';
import type { TemplateResolver } from '../engine/TemplateResolver';
import type { InferSchemaOutput, StandardSchemaV1 } from '../infra/StandardSchema';
import type {
    AdvancedConverterReturn,
    BuiltInConverter,
    ConditionalReturn,
    ConverterFunction,
    EnvaptConverter,
    EnvKeyInput,
    InferConverterReturnType,
    InferSpecField,
    KeyCasing,
    RecaseKey,
    RequiredSpec,
    SchemaConstraint,
    TimeFallback
} from '../types';

function formatKeyForError(key: EnvKeyInput): string {
    return Array.isArray(key) ? `[${key.join(', ')}]` : String(key);
}

// check after template resolution because a template can resolve to an empty string
export function resolveRequired(
    resolved: { key: string; value: string | undefined },
    templateResolver: TemplateResolver
): { key: string; value: string | undefined } {
    if (resolved.value === undefined) return resolved;
    const value = templateResolver.resolveTemplate(resolved.key, resolved.value);
    return { key: resolved.key, value: isMissing(value) ? undefined : value };
}

export class AdvancedMethods extends PrimitiveMethods {
    /**
     * Get an environment variable using a built-in converter.
     *
     * Supports both scalar tokens (e.g. `Converters.Number`) and `ArrayOf<...>` tokens
     * produced by `Converters.array(...)`. The key can be a single name or an ordered list.
     * The first defined value wins.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#converters}
     * @see {@link https://envapt.materwelon.dev/docs/converters#custom-converters}
     */
    // TypeScript uses the first overload that matches. Keep 'time' above the generic one.
    static getUsing<TFallback extends TimeFallback | undefined = undefined>(
        key: EnvKeyInput,
        converter: 'time',
        fallback?: TFallback
    ): ConditionalReturn<number, TFallback>;
    static getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback>;
    static getUsing<TReturn>(key: EnvKeyInput, converter: BuiltInConverter | ArrayOf, fallback?: TReturn): TReturn;
    static getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback> {
        const { key: resolvedKey, value } = resolveKeyInput(key);

        // a time fallback can be a string that still needs converting to a number
        if (isMissing(value) && !hasFallback(fallback)) {
            debugWarn(`${resolvedKey} is missing or empty`);
            return undefined as AdvancedConverterReturn<TConverter, TFallback>;
        }

        const result = valueConverter.convertValue(resolvedKey, fallback, converter, hasFallback(fallback));

        return result as AdvancedConverterReturn<TConverter, TFallback>;
    }

    /**
     * @see {@link AdvancedMethods.getUsing}
     */
    getUsing<TFallback extends TimeFallback | undefined = undefined>(
        key: EnvKeyInput,
        converter: 'time',
        fallback?: TFallback
    ): ConditionalReturn<number, TFallback>;
    getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback>;
    getUsing<TReturn>(key: EnvKeyInput, converter: BuiltInConverter | ArrayOf, fallback?: TReturn): TReturn;
    getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converter: TConverter,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback> {
        return AdvancedMethods.getUsing(key, converter, fallback);
    }

    /**
     * Get an environment variable using a custom converter function.
     * Accepts a single key or an ordered list for automatic fallback.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#converters}
     * @see {@link https://envapt.materwelon.dev/docs/converters#custom-converters}
     */
    static getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback> {
        // run the custom converter even on a missing value, with raw as undefined
        const result = valueConverter.convertValue<TReturnType>(key, fallback, converter, hasFallback(fallback));

        return result as ConditionalReturn<TReturnType, TFallback>;
    }

    /**
     * @see {@link AdvancedMethods.getWith}
     */
    getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback> {
        return AdvancedMethods.getWith(key, converter, fallback);
    }

    /**
     * Read a required environment variable and convert it, throwing `MissingEnvValue` when the value
     * is missing or empty. Returns the non-undefined converter output. Accepts a built-in or `ArrayOf`
     * token, or a custom parser function. The key can be a single name or an ordered list.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#fail-fast-on-missing-values}
     * @see {@link https://envapt.materwelon.dev/docs/converters#require-a-converted-value}
     */
    static getRequired<TConverter extends BuiltInConverter | ArrayOf>(
        key: EnvKeyInput,
        converter: TConverter
    ): InferConverterReturnType<TConverter>;
    static getRequired<TReturnType>(key: EnvKeyInput, converter: ConverterFunction<TReturnType, string>): TReturnType;
    static getRequired<TConverter extends BuiltInConverter | ArrayOf, TReturnType>(
        key: EnvKeyInput,
        converter: TConverter | ConverterFunction<TReturnType, string>
    ): InferConverterReturnType<TConverter> | TReturnType {
        // an empty value falls through to the next key
        const candidates: readonly string[] = typeof key === 'string' ? [key] : key;
        let resolvedKey = '';
        let value: string | undefined;
        for (const candidate of candidates) {
            const resolved = resolveRequired(resolveKeyInput(candidate), templateResolver);
            resolvedKey = resolved.key;
            if (resolved.value !== undefined) {
                value = resolved.value;
                break;
            }
        }
        if (value === undefined) {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Required environment variable "${formatKeyForError(key)}" is missing or empty.`
            );
        }
        // the string-only parser is safe to widen because the value is present
        const result = valueConverter.convertValue<TReturnType>(
            resolvedKey,
            undefined,
            converter as EnvaptConverter<TReturnType>,
            false
        );
        // a built-in returns undefined when it cannot convert, and a custom converter can return null
        if (result === undefined || result === null) {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Required environment variable "${formatKeyForError(key)}" is present but could not be converted.`
            );
        }
        return result;
    }

    /**
     * @see {@link AdvancedMethods.getRequired}
     */
    getRequired<TConverter extends BuiltInConverter | ArrayOf>(
        key: EnvKeyInput,
        converter: TConverter
    ): InferConverterReturnType<TConverter>;
    getRequired<TReturnType>(key: EnvKeyInput, converter: ConverterFunction<TReturnType, string>): TReturnType;
    getRequired<TConverter extends BuiltInConverter | ArrayOf, TReturnType>(
        key: EnvKeyInput,
        converter: TConverter | ConverterFunction<TReturnType, string>
    ): InferConverterReturnType<TConverter> | TReturnType {
        return AdvancedMethods.getRequired(key, converter as ConverterFunction<TReturnType, string>);
    }

    /**
     * Read a group of required environment variables in one call. Each key in `spec` maps to a
     * converter (a token, an `array()` token, or a custom parser), and the returned record holds
     * every converted value, all non-undefined. Collects every missing or empty key and throws one
     * `MissingEnvValue` listing them all. Pass a `casing` (`'camelCase'`, `'PascalCase'`, or
     * `'kebab-case'`) to rename the record keys. The rename splits each key on underscores, as in
     * SCREAMING_SNAKE env-var names. With no casing the keys stay as-is.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#fail-fast-on-missing-values}
     * @see {@link https://envapt.materwelon.dev/docs/converters#require-a-converted-value}
     */
    static getRequiredAll<Spec extends RequiredSpec, Casing extends KeyCasing | undefined = undefined>(
        spec: Spec,
        casing?: Casing
    ): { [K in keyof Spec as RecaseKey<K & string, Casing>]: InferSpecField<Spec[K]> } {
        const keys = Object.keys(spec);
        const missing = keys.filter(
            (key) => resolveRequired(resolveKeyInput(key), templateResolver).value === undefined
        );
        if (missing.length > 0) {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Missing required environment variables: ${missing.join(', ')}.`
            );
        }

        const result: Record<string, unknown> = {};
        for (const key of keys) {
            // safe to widen because every value is present by now
            const converted = valueConverter.convertValue<unknown>(
                key,
                undefined,
                spec[key] as EnvaptConverter<unknown>,
                false
            );
            if (converted === undefined || converted === null) {
                throw new EnvaptError(
                    EnvaptErrorCodes.MissingEnvValue,
                    `Required environment variable "${key}" is present but could not be converted.`
                );
            }
            result[recase(key, casing)] = converted;
        }
        return result as { [K in keyof Spec as RecaseKey<K & string, Casing>]: InferSpecField<Spec[K]> };
    }

    /**
     * @see {@link AdvancedMethods.getRequiredAll}
     */
    getRequiredAll<Spec extends RequiredSpec, Casing extends KeyCasing | undefined = undefined>(
        spec: Spec,
        casing?: Casing
    ): { [K in keyof Spec as RecaseKey<K & string, Casing>]: InferSpecField<Spec[K]> } {
        return AdvancedMethods.getRequiredAll(spec, casing);
    }

    /**
     * Validate an environment variable through a {@link StandardSchemaV1}-conformant schema
     * (zod, valibot, arktype, etc). Throws `MissingEnvValue` if the env value is absent and
     * no fallback is provided. When the value is missing, the fallback is returned as-is and does
     * not pass through the schema.
     *
     * Synchronous schemas only. A `validate` that returns a Promise throws `InvalidUserDefinedConfig`.
     *
     * @example
     * ```ts
     * import { z } from 'zod';
     * const port = Envapter.parse('PORT', z.coerce.number().min(1024).max(65535), 3000);
     * ```
     * @see {@link https://envapt.materwelon.dev/docs/standard-schema#any-conformant-validator-or-none}
     */
    static parse<Schema extends StandardSchemaV1>(
        key: EnvKeyInput,
        schema: SchemaConstraint<Schema>,
        fallback?: InferSchemaOutput<Schema>
    ): InferSchemaOutput<Schema> {
        // SchemaConstraint rejects async schemas at compile time
        const result = valueConverter.convertWithSchema(
            key,
            schema as unknown as StandardSchemaV1,
            fallback,
            hasFallback(fallback)
        );
        return result;
    }

    /**
     * @see {@link AdvancedMethods.parse}
     */
    parse<Schema extends StandardSchemaV1>(
        key: EnvKeyInput,
        schema: SchemaConstraint<Schema>,
        fallback?: InferSchemaOutput<Schema>
    ): InferSchemaOutput<Schema> {
        const result = valueConverter.convertWithSchema(
            key,
            schema as unknown as StandardSchemaV1,
            fallback,
            hasFallback(fallback)
        );
        return result;
    }
}
