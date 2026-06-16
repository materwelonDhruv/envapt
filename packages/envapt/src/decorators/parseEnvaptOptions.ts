import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { Validator } from '../Validators';

import type { DecoratorConfig } from './resolveDecoratorValue';
import type { StandardSchemaV1 } from '../StandardSchema';
import type { EnvaptConverter } from '../types';

// shared by legacy and modern @Envapt so both surfaces validate options identically
export function parseEnvaptOptions<TFallback>(options: unknown): DecoratorConfig<TFallback> {
    let fallback: TFallback | undefined;
    let converter: EnvaptConverter<TFallback> | undefined;
    let schema: StandardSchemaV1 | undefined;
    let hasFallback = false;
    let required = false;

    if (options !== undefined) {
        if (
            typeof options !== 'object' ||
            options === null ||
            !('fallback' in options || 'converter' in options || 'required' in options || 'schema' in options)
        ) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                'The positional `@Envapt(key, fallback, converter)` form was removed in v6. Pass an options object instead, like `@Envapt(key, { converter, fallback })`, or use one of the sugar decorators.'
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
        hasFallback = 'fallback' in opts;
        required = opts.required === true;

        if (required && hasFallback && fallback !== undefined) {
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

    return { fallback, converter, hasFallback, required, schema };
}
