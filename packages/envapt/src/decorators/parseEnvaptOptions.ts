import { hasFallback } from '../core/missing';
import { Validator } from '../engine/Validators';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { DecoratorConfig } from './resolveDecoratorValue';
import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type { EnvaptConverter } from '../types';

export function parseEnvaptOptions<TFallback>(options: unknown): DecoratorConfig<TFallback> {
    let fallback: TFallback | undefined;
    let converter: EnvaptConverter<TFallback> | undefined;
    let schema: StandardSchemaV1 | undefined;
    let required = false;

    if (options !== undefined) {
        if (
            typeof options !== 'object' ||
            options === null ||
            !('fallback' in options || 'converter' in options || 'required' in options || 'schema' in options)
        ) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                '`@Envapt` takes an options object as its second argument, like `@Envapt(key, { converter, fallback })`.'
            );
        }

        const opts = options as {
            fallback?: TFallback;
            converter?: EnvaptConverter<TFallback>;
            required?: boolean;
            schema?: unknown;
        };
        fallback = opts.fallback;
        converter = opts.converter;
        required = opts.required === true;
        Validator.rejectNonConverter(converter);

        if (required && hasFallback(fallback)) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                '`required: true` and `fallback` are mutually exclusive on @Envapt options. Drop the fallback or call `Envapter.require()` separately.'
            );
        }

        if ('schema' in opts && opts.schema !== undefined) {
            if (!Validator.isStandardSchema(opts.schema)) {
                throw new EnvaptError(
                    EnvaptErrorCodes.InvalidUserDefinedConfig,
                    '`schema` must be a Standard Schema v1 object (zod, valibot, arktype, or any `~standard`-conformant value).'
                );
            }
            if (converter !== undefined) {
                throw new EnvaptError(
                    EnvaptErrorCodes.InvalidUserDefinedConfig,
                    '`schema` and `converter` are mutually exclusive on @Envapt options. Drop one as they both turn a raw env string into a typed value.'
                );
            }
            schema = opts.schema;
        }
    }

    return { fallback, converter, required, schema };
}
