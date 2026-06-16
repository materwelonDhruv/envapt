import { ValueConverter } from '../converters';
import { EnvaptCache } from '../core';
import { Envapter } from '../Envapter';
import { EnvaptError, EnvaptErrorCodes } from '../Error';

import type { StandardSchemaV1 } from '../StandardSchema';
import type { EnvaptConverter, EnvKeyInput } from '../types';

export interface DecoratorConfig<TFallback> {
    fallback: TFallback | undefined;
    converter: EnvaptConverter<TFallback> | undefined;
    hasFallback: boolean;
    required: boolean;
    schema: StandardSchemaV1 | undefined;
}

function formatKeyForError(key: EnvKeyInput): string {
    return Array.isArray(key) ? `[${key.join(', ')}]` : String(key);
}

// shared by both decorator installers so the required-check, dispatch, and cache stay in one place
// each installer passes `cacheKey` since the class name is reached differently per decorator API
export function resolveDecoratorValue<TFallback>(
    key: EnvKeyInput,
    config: DecoratorConfig<TFallback>,
    cacheKey: string
): TFallback | null | undefined {
    const { fallback, converter, hasFallback, required, schema } = config;

    let value = EnvaptCache.get(cacheKey) as TFallback | null | undefined;
    if (value !== undefined) return value;

    const envapter = new Envapter();

    if (required && schema === undefined) {
        const rawValue = envapter.getRaw(key);
        if (rawValue === undefined || rawValue.trim() === '') {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Required environment variable "${formatKeyForError(key)}" is missing or empty.`
            );
        }
    }

    const valueConverter = new ValueConverter(envapter);
    value =
        schema !== undefined
            ? (valueConverter.convertWithSchema(key, schema, fallback, hasFallback) as TFallback)
            : valueConverter.convertValue(key, fallback, converter, hasFallback);

    EnvaptCache.set(cacheKey, value);
    return value;
}
