import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { PrimitiveMethods } from './PrimitiveMethods';

import type { ArrayOf } from '../Converters';
import type { InferSchemaOutput, StandardSchemaV1 } from '../StandardSchema';
import type {
    AdvancedConverterReturn,
    BuiltInConverter,
    ConditionalReturn,
    ConverterFunction,
    EnvKeyInput,
    InferConverterReturnType,
    SchemaConstraint,
    TimeFallback
} from '../Types';

interface GetUsingRequiredOptions<TConverter> {
    converter: TConverter;
    required: true;
}

interface GetWithRequiredOptions<TReturnType> {
    converter: ConverterFunction<TReturnType>;
    required: true;
}

function isOptionsBag(value: unknown): value is { converter: unknown; required?: boolean; fallback?: unknown } {
    // `ArrayOf` tokens have `of`/`delimiter` but no `converter` key, so the presence of
    // `converter` discriminates the options-bag form from a positional converter token.
    return typeof value === 'object' && value !== null && 'converter' in value;
}

function formatKeyForError(key: EnvKeyInput): string {
    return Array.isArray(key) ? `[${key.join(', ')}]` : String(key);
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
     * produced by `Converters.array(...)`. The key can be a single name or an ordered list;
     * the first defined value wins.
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
    static getUsing(key: EnvKeyInput, options: GetUsingRequiredOptions<'time'>): number;
    static getUsing<TConverter extends BuiltInConverter | ArrayOf>(
        key: EnvKeyInput,
        options: GetUsingRequiredOptions<TConverter>
    ): InferConverterReturnType<TConverter>;
    static getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converterOrOptions: TConverter | GetUsingRequiredOptions<TConverter>,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback> {
        if (isOptionsBag(converterOrOptions)) {
            const options = converterOrOptions;
            const { key: resolvedKey, value } = this.resolveKeyInput(key);

            if (value === undefined || value.trim() === '') {
                throw new EnvaptError(
                    EnvaptErrorCodes.MissingEnvValue,
                    `Required environment variable "${formatKeyForError(key)}" is missing or empty.`
                );
            }

            const result = this.parser.convertValue(resolvedKey, undefined, options.converter as TConverter, false);
            return result as AdvancedConverterReturn<TConverter, TFallback>;
        }

        const converter = converterOrOptions as TConverter;
        const { key: resolvedKey, value } = this.resolveKeyInput(key);

        // No env value AND no fallback: return undefined to match primitive-method semantics.
        // Otherwise route through the parser so asymmetric fallback types (TimeFallback,
        // TimeFallback[] for `of: time` arrays) get coerced to the declared return type.
        if (this.treatAsMissing(value) && fallback === undefined) {
            return undefined as AdvancedConverterReturn<TConverter, TFallback>;
        }

        const hasFallback = fallback !== undefined;
        const result = this.parser.convertValue(resolvedKey, fallback, converter, hasFallback);

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
    getUsing(key: EnvKeyInput, options: GetUsingRequiredOptions<'time'>): number;
    getUsing<TConverter extends BuiltInConverter | ArrayOf>(
        key: EnvKeyInput,
        options: GetUsingRequiredOptions<TConverter>
    ): InferConverterReturnType<TConverter>;
    getUsing<TConverter extends BuiltInConverter | ArrayOf, TFallback = undefined>(
        key: EnvKeyInput,
        converterOrOptions: TConverter | GetUsingRequiredOptions<TConverter>,
        fallback?: TFallback
    ): AdvancedConverterReturn<TConverter, TFallback> {
        return AdvancedMethods.getUsing(key, converterOrOptions as TConverter, fallback) as AdvancedConverterReturn<
            TConverter,
            TFallback
        >;
    }

    /**
     * Get an environment variable using a custom converter function.
     * Accepts a single key or an ordered list for automatic fallback.
     */
    static getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback>;
    static getWith<TReturnType>(key: EnvKeyInput, options: GetWithRequiredOptions<TReturnType>): TReturnType;
    static getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converterOrOptions: ConverterFunction<TReturnType> | GetWithRequiredOptions<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback> {
        if (isOptionsBag(converterOrOptions)) {
            const options = converterOrOptions;
            const { key: resolvedKey, value } = this.resolveKeyInput(key);

            if (value === undefined || value.trim() === '') {
                throw new EnvaptError(
                    EnvaptErrorCodes.MissingEnvValue,
                    `Required environment variable "${formatKeyForError(key)}" is missing or empty.`
                );
            }

            const result = this.parser.convertValue(
                resolvedKey,
                undefined,
                options.converter as ConverterFunction<undefined>,
                false
            );
            return result as ConditionalReturn<TReturnType, TFallback>;
        }

        // Check if variable exists first, for consistency with primitive methods
        const { key: resolvedKey, value } = this.resolveKeyInput(key);
        if (this.treatAsMissing(value)) return fallback as ConditionalReturn<TReturnType, TFallback>;

        const hasFallback = fallback !== undefined;
        // Convert the converter to match the expected signature via unknown
        const result = this.parser.convertValue(
            resolvedKey,
            fallback,
            converterOrOptions as unknown as ConverterFunction<TFallback>,
            hasFallback
        );

        return result as ConditionalReturn<TReturnType, TFallback>;
    }

    /**
     * @see {@link AdvancedMethods.getWith}
     */
    getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converter: ConverterFunction<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback>;
    getWith<TReturnType>(key: EnvKeyInput, options: GetWithRequiredOptions<TReturnType>): TReturnType;
    getWith<TReturnType, TFallback extends TReturnType | undefined = undefined>(
        key: EnvKeyInput,
        converterOrOptions: ConverterFunction<TReturnType> | GetWithRequiredOptions<TReturnType>,
        fallback?: TFallback
    ): ConditionalReturn<TReturnType, TFallback> {
        return AdvancedMethods.getWith(key, converterOrOptions as ConverterFunction<TReturnType>, fallback);
    }

    /**
     * Validate an environment variable through a {@link StandardSchemaV1}-conformant schema
     * (zod, valibot, arktype, etc). Throws `MissingEnvValue` if the env value is absent and
     * no fallback is provided. The fallback, when provided, is returned as-is on missing;
     * it does NOT pass through the schema (mirrors custom-converter behavior).
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
        const result = this.parser.convertWithSchema(key, schema as unknown as StandardSchemaV1, fallback, hasFallback);
        return result as InferSchemaOutput<Schema>;
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
        const result = AdvancedMethods.parser.convertWithSchema(
            key,
            schema as unknown as StandardSchemaV1,
            fallback,
            hasFallback
        );
        return result as InferSchemaOutput<Schema>;
    }
}
