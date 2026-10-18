import { findPresent, readRequired, readSchema, resolveKeyInput, valueConverter } from './engine';
import { hasFallback, isMissing } from './missing';
import { PrimitiveMethods } from './PrimitiveMethods';
import { debugWarn } from '../infra/Debug';
import { EnvaptErrorCodes } from '../infra/Error';
import { missingValues, validationFailed } from '../infra/failures';
import { recase } from '../infra/recase';

import type { ArrayOf } from '../converters';
import type { InferSchemaOutput, StandardSchemaV1 } from '../infra/StandardSchema';
import type {
    AdvancedConverterReturn,
    BuiltInConverter,
    ConditionalReturn,
    ConverterFunction,
    EnvKeyInput,
    InferConverterReturnType,
    InferSpecField,
    KeyCasing,
    PresentValue,
    RecaseKey,
    RequiredConverter,
    RequiredSpec,
    SchemaConstraint,
    SpecSchemaConstraint,
    TimeFallback
} from '../types';

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
     * Get an environment variable using a custom converter function. The converter runs only on a present
     * value. A missing value, or a converter result of `undefined` or `null`, returns the fallback.
     * Accepts a single key or an ordered list for automatic fallback.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#converters}
     * @see {@link https://envapt.materwelon.dev/docs/converters#custom-converters}
     */
    static getWith<TReturnType, TFallback extends NonNullable<TReturnType> | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<NonNullable<TReturnType>, TFallback> {
        const result = valueConverter.convertValue<TReturnType>(key, fallback, converter, hasFallback(fallback));

        return result as ConditionalReturn<NonNullable<TReturnType>, TFallback>;
    }

    /**
     * @see {@link AdvancedMethods.getWith}
     */
    getWith<TReturnType, TFallback extends NonNullable<TReturnType> | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<NonNullable<TReturnType>, TFallback> {
        return AdvancedMethods.getWith(key, converter, fallback);
    }

    /**
     * Read a required environment variable and convert it, throwing `MissingEnvValue` when the value
     * is missing or empty. A value the converter cannot convert throws `InvalidEnvValue` with
     * one issue keyed by the env name. A bad array element, an error a custom parser throws, and a
     * schema's issues all become issues on that error. Accepts a built-in or `ArrayOf` token, a custom
     * parser function, or a synchronous Standard Schema. The key can be a single name or an ordered list.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#fail-fast-on-missing-values}
     * @see {@link https://envapt.materwelon.dev/docs/converters#require-a-converted-value}
     */
    static getRequired<TConverter extends BuiltInConverter | ArrayOf>(
        key: EnvKeyInput,
        converter: TConverter
    ): InferConverterReturnType<TConverter>;
    // arktype types are callable and would match the function overload below
    static getRequired<Schema extends StandardSchemaV1>(
        key: EnvKeyInput,
        schema: SchemaConstraint<Schema>
    ): InferSchemaOutput<Schema>;
    static getRequired<TReturnType>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>
    ): NonNullable<TReturnType>;
    static getRequired(key: EnvKeyInput, converter: RequiredConverter | StandardSchemaV1): unknown {
        return readRequired(key, converter);
    }

    /**
     * @see {@link AdvancedMethods.getRequired}
     */
    getRequired<TConverter extends BuiltInConverter | ArrayOf>(
        key: EnvKeyInput,
        converter: TConverter
    ): InferConverterReturnType<TConverter>;
    getRequired<Schema extends StandardSchemaV1>(
        key: EnvKeyInput,
        schema: SchemaConstraint<Schema>
    ): InferSchemaOutput<Schema>;
    getRequired<TReturnType>(key: EnvKeyInput, converter: ConverterFunction<TReturnType>): NonNullable<TReturnType>;
    getRequired(key: EnvKeyInput, converter: RequiredConverter | StandardSchemaV1): unknown {
        return readRequired(key, converter);
    }

    /**
     * Read a group of required environment variables in one call. Each key in `spec` maps to a
     * converter (a token, an `array()` token, or a custom parser) or a synchronous Standard Schema
     * (zod, valibot, arktype, etc). The returned record holds every value. A converter field is
     * never undefined. A schema field holds whatever its schema returns.
     *
     * Collects every missing or empty key first and throws one `MissingEnvValue` listing them all.
     * envapt never runs the schema for a missing key. A schema default such as zod's `.default()`
     * does not apply here. envapt then reads every field and throws one `InvalidEnvValue` for all
     * the bad values, schema fields included. Its `issues` hold every failed field's issues, each
     * with its env key first in `path`. A converter that cannot convert adds the issue
     * `could not be converted`. A bad array element and an error a custom parser or schema throws
     * each become an issue carrying their message.
     * The error message lists only the keys, since an issue message can quote the value.
     *
     * Pass a `casing` (`'camelCase'`, `'PascalCase'`, or `'kebab-case'`) to rename the record keys.
     * The rename splits each key on underscores, as in SCREAMING_SNAKE env-var names. With no casing
     * the keys stay as-is.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#fail-fast-on-missing-values}
     * @see {@link https://envapt.materwelon.dev/docs/standard-schema#validate-a-group-of-required-variables}
     */
    static getRequiredAll<Spec extends RequiredSpec, Casing extends KeyCasing | undefined = undefined>(
        spec: Spec & SpecSchemaConstraint<Spec>,
        casing?: Casing
    ): { [K in keyof Spec as RecaseKey<K & string, Casing>]: InferSpecField<Spec[K]> } {
        const missing: string[] = [];
        const fields: { present: PresentValue; field: RequiredSpec[string] }[] = [];
        for (const [key, field] of Object.entries<RequiredSpec[string]>(spec)) {
            const present = findPresent(key);
            if (present === undefined) missing.push(key);
            else fields.push({ present, field });
        }
        if (missing.length > 0) throw missingValues(missing);

        const result: Record<string, unknown> = {};
        const failedKeys: string[] = [];
        const issues: StandardSchemaV1.Issue[] = [];
        for (const { present, field } of fields) {
            const outcome = valueConverter.readSpecField(present, field);
            if (outcome.issues === undefined) {
                result[recase(present.key, casing)] = outcome.value;
            } else {
                failedKeys.push(present.key);
                issues.push(...outcome.issues);
            }
        }
        if (failedKeys.length > 0) throw validationFailed(EnvaptErrorCodes.InvalidEnvValue, failedKeys, issues);
        return result as { [K in keyof Spec as RecaseKey<K & string, Casing>]: InferSpecField<Spec[K]> };
    }

    /**
     * @see {@link AdvancedMethods.getRequiredAll}
     */
    getRequiredAll<Spec extends RequiredSpec, Casing extends KeyCasing | undefined = undefined>(
        spec: Spec & SpecSchemaConstraint<Spec>,
        casing?: Casing
    ): { [K in keyof Spec as RecaseKey<K & string, Casing>]: InferSpecField<Spec[K]> } {
        return AdvancedMethods.getRequiredAll<Spec, Casing>(spec, casing);
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
        return readSchema(key, schema as unknown as StandardSchemaV1, fallback, hasFallback(fallback));
    }

    /**
     * @see {@link AdvancedMethods.parse}
     */
    parse<Schema extends StandardSchemaV1>(
        key: EnvKeyInput,
        schema: SchemaConstraint<Schema>,
        fallback?: InferSchemaOutput<Schema>
    ): InferSchemaOutput<Schema> {
        return AdvancedMethods.parse(key, schema, fallback);
    }
}
