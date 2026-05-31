import { ValueConverter } from '../converters';
import { EnvaptCache } from '../core';
import { Envapter } from '../Envapter';
import { EnvaptError, EnvaptErrorCodes } from '../Error';

import type { StandardSchemaV1 } from '../StandardSchema';
import type { EnvaptConverter, EnvKeyInput } from '../types';

function formatKeyForError(key: EnvKeyInput): string {
    return Array.isArray(key) ? `[${key.join(', ')}]` : String(key);
}

interface DecoratorConfig<TFallback> {
    fallback: TFallback | undefined;
    converter: EnvaptConverter<TFallback> | undefined;
    hasFallback: boolean;
    required: boolean;
    schema: StandardSchemaV1 | undefined;
}

export function createPropertyDecorator<TFallback>(
    key: EnvKeyInput,
    config: DecoratorConfig<TFallback>
): PropertyDecorator {
    const { fallback, converter, hasFallback, required, schema } = config;
    return function (target: object, prop: string | symbol): void {
        const propKey = String(prop);
        // Distinguishing constructor (static) from prototype (instance) keeps same-named static and instance properties from colliding in the cache.
        const className = typeof target === 'function' ? target.name : target.constructor.name;
        const cacheKey = `${className}.${propKey}`;

        Object.defineProperty(target, propKey, {
            get: function () {
                let value = EnvaptCache.get(cacheKey) as TFallback | null | undefined;

                if (value === undefined) {
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
                    if (schema !== undefined) {
                        value = valueConverter.convertWithSchema(key, schema, fallback, hasFallback) as TFallback;
                    } else {
                        value = valueConverter.convertValue(key, fallback, converter, hasFallback);
                    }
                    EnvaptCache.set(cacheKey, value);
                }

                return value;
            },
            configurable: false,
            enumerable: true
        });
    };
}
