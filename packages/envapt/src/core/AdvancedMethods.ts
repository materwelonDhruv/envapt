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

// template-resolve a present value, treating a post-trim-empty result as missing regardless of strict.
// a module function so getRequired/getRequiredAll and Envapter.require share it without exposing it on any subclass.
export function resolveRequired(
    resolved: { key: string; value: string | undefined },
    templateResolver: TemplateResolver
): { key: string; value: string | undefined } {
    if (resolved.value === undefined) return resolved;
    const value = templateResolver.resolveTemplate(resolved.key, resolved.value);
    return { key: resolved.key, value: value.trim() === '' ? undefined : value };
}

/**
 * Mixin for advanced methods for environment variable conversion using built-in and custom converters
 * @internal
 */
export class AdvancedMethods extends PrimitiveMethods {
    /**
     * Get an environment variable using a built-in converter.
     *
     * Supports both scalar tokens (e.g. `Converters.Number`) and `ArrayOf<...>` tokens
     * produced by `Converters.array(...)`. The key can be a single name or an ordered list.
     * The first defined value wins.
     */
    // Time-specific overload must precede the generic BuiltInConverter overload so it wins
    // overload resolution (TimeFallback accepts time-strings like `'10s'`).
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
        const { key: resolvedKey, value } = this.resolveKeyInput(key);

        // missing with no fallback returns undefined, matching the primitive methods. with a fallback,
        // route through the parser so asymmetric types (TimeFallback, TimeFallback[] for `of: time`)
        // coerce to the return type.
        if (this.treatAsMissing(value) && fallback === undefined) {
            debugWarn(`${resolvedKey} is missing or empty`);
            return undefined as AdvancedConverterReturn<TConverter, TFallback>;
        }

        const hasFallback = fallback !== undefined;
        const result = this.valueConverter.convertValue(resolvedKey, fallback, converter, hasFallback);

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
     */
    static getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback> {
        const { key: resolvedKey, value } = this.resolveKeyInput(key);
        if (this.treatAsMissing(value)) {
            debugWarn(`${resolvedKey} is missing or empty`);
            return fallback as ConditionalReturn<TReturnType, TFallback>;
        }

        const hasFallback = fallback !== undefined;
        const result = this.valueConverter.convertValue<TReturnType>(resolvedKey, fallback, converter, hasFallback);

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
        // a required read treats empty as missing, so an empty value falls through to the next candidate.
        const candidates: readonly string[] = typeof key === 'string' ? [key] : key;
        let resolvedKey = '';
        let value: string | undefined;
        for (const candidate of candidates) {
            const resolved = resolveRequired(this.resolveKeyInput(candidate), this.templateResolver);
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
        // cast widens the raw-string parser back to convertValue's ConverterFunction<T> (value proven present above).
        const result = this.valueConverter.convertValue<TReturnType>(
            resolvedKey,
            undefined,
            converter as EnvaptConverter<TReturnType>,
            false
        );
        // convertValue returns null for a present value it can't convert, which would break the non-undefined return.
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
     * `'kebab-case'`) to rename the record keys, splitting on underscores, which assumes the
     * conventional SCREAMING_SNAKE env-var names. With no casing the keys stay as-is.
     */
    static getRequiredAll<Spec extends RequiredSpec, Casing extends KeyCasing | undefined = undefined>(
        spec: Spec,
        casing?: Casing
    ): { [K in keyof Spec as RecaseKey<K & string, Casing>]: InferSpecField<Spec[K]> } {
        const keys = Object.keys(spec);
        const missing = keys.filter(
            (key) => resolveRequired(this.resolveKeyInput(key), this.templateResolver).value === undefined
        );
        if (missing.length > 0) {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Missing required environment variables: ${missing.join(', ')}.`
            );
        }

        const result: Record<string, unknown> = {};
        for (const key of keys) {
            // same widening cast as getRequired, every value was proven present above.
            const converted = this.valueConverter.convertValue<unknown>(
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
     * no fallback is provided. The fallback, when provided, is returned as-is on missing.
     * It does NOT pass through the schema, mirroring custom-converter behavior.
     *
     * Synchronous schemas only. A Promise-returning `validate` triggers an
     * `InvalidUserDefinedConfig` throw at the call site.
     *
     * @example
     * ```ts
     * import { z } from 'zod';
     * const port = Envapter.parse('PORT', z.coerce.number().min(1024).max(65535), 3000);
     * ```
     */
    static parse<Schema extends StandardSchemaV1>(
        key: EnvKeyInput,
        schema: SchemaConstraint<Schema>,
        fallback?: InferSchemaOutput<Schema>
    ): InferSchemaOutput<Schema> {
        const hasFallback = arguments.length > 2;
        // SchemaConstraint resolves to the unsatisfiable SchemaMustBeSync brand for async
        // schemas, so reaching this body means the input is structurally a sync Schema.
        const result = this.valueConverter.convertWithSchema(
            key,
            schema as unknown as StandardSchemaV1,
            fallback,
            hasFallback
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
        const hasFallback = arguments.length > 2;
        const result = AdvancedMethods.valueConverter.convertWithSchema(
            key,
            schema as unknown as StandardSchemaV1,
            fallback,
            hasFallback
        );
        return result;
    }
}
