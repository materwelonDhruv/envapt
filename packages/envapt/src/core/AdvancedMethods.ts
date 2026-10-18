import { readOptional, readRequired, readRequiredAll } from './engine';
import { PrimitiveMethods } from './PrimitiveMethods';

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
    RecaseKey,
    RequiredConverter,
    RequiredSpec,
    SchemaConstraint,
    SpecSchemaConstraint,
    TimeFallback
} from '../types';

export class AdvancedMethods extends PrimitiveMethods {
    /**
     * Get an environment variable through a converter: a built-in token such as `Converters.Number`,
     * an `ArrayOf` token from `Converters.array(...)`, a custom `(raw: string) => T` function, or a
     * synchronous Standard Schema (zod, valibot, arktype). A missing value returns the fallback, or
     * `undefined` without one. A token or a function that can't convert the value returns the fallback
     * too. A schema that rejects the value throws `SchemaValidationFailed`. The schema never sees the
     * fallback. The key can be a single name or an ordered list. The first present value wins.
     * A bad converter or fallback throws even when the value is missing.
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
    // arktype types are callable and would match the function overload below
    static getUsing<
        Schema extends StandardSchemaV1,
        TFallback extends InferSchemaOutput<Schema> | undefined = undefined
    >(
        key: EnvKeyInput,
        schema: SchemaConstraint<Schema>,
        fallback?: TFallback
    ): ConditionalReturn<InferSchemaOutput<Schema>, TFallback>;
    static getUsing<TReturn, TFallback extends NonNullable<TReturn> | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturn>,
        fallback?: TFallback
    ): ConditionalReturn<NonNullable<TReturn>, TFallback>;
    static getUsing(
        key: EnvKeyInput,
        converter: BuiltInConverter | ArrayOf | ConverterFunction | StandardSchemaV1,
        fallback?: unknown
    ): unknown {
        return readOptional(key, converter, fallback);
    }

    /**
     * Read a required environment variable and convert it, throwing `MissingEnvValue` when the value
     * is missing or empty. A value it cannot convert throws `InvalidEnvValue` with issues keyed by
     * the env name. A bad array element, an error a custom parser or schema throws, and a schema's
     * own issues all become issues on that error. Accepts a built-in or `ArrayOf` token, a custom
     * parser function, or a synchronous Standard Schema. The key can be a single name or an ordered list.
     * A bad converter throws before `MissingEnvValue`.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#fail-fast-on-missing-values}
     * @see {@link https://envapt.materwelon.dev/docs/converters#require-a-converted-value}
     */
    static getRequired<TConverter extends BuiltInConverter | ArrayOf>(
        key: EnvKeyInput,
        converter: TConverter
    ): InferConverterReturnType<TConverter>;
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
     * Read a group of required environment variables in one call. Each key in `spec` maps to a
     * converter (a token, an `array()` token, or a custom parser) or a synchronous Standard Schema
     * (zod, valibot, arktype, etc). The returned record holds every value. A converter field is
     * never undefined. A schema field holds whatever its schema returns.
     *
     * A bad converter in `spec` throws first. envapt then collects every missing or empty key and
     * throws one `MissingEnvValue` listing them all.
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
        return readRequiredAll(spec, casing) as {
            [K in keyof Spec as RecaseKey<K & string, Casing>]: InferSpecField<Spec[K]>;
        };
    }
}
