import { ValueConverter } from '../converters';
import { isMissing } from '../core/missing';
import { cache } from '../core/state';
import { Envapter } from '../engine/Envapter';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { StandardSchemaV1 } from '../infra/StandardSchema';
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

const classIds = new WeakMap<object, number>();
let nextClassId = 0;

// keyed on the constructor object's identity so two same-named classes (and a same-named
// static/instance pair) stay in separate cache slots
export function decoratorCacheKey(owner: object, isStatic: boolean, prop: string): string {
    let id = classIds.get(owner);
    if (id === undefined) {
        id = nextClassId++;
        classIds.set(owner, id);
    }
    return `${id}.${isStatic ? 'static' : 'instance'}.${prop}`;
}

export function resolveDecoratorValue<TFallback>(
    key: EnvKeyInput,
    config: DecoratorConfig<TFallback>,
    cacheKey: string
): TFallback | undefined {
    const { fallback, converter, hasFallback, required, schema } = config;

    // cache.has guards the read so a cached undefined counts as resolved (a converter returning
    // undefined, or a missing no-fallback read) and later accesses skip re-resolving
    if (cache.has(cacheKey)) return cache.get(cacheKey) as TFallback | undefined;

    const envapter = new Envapter();

    if (required && schema === undefined) {
        const rawValue = envapter.getRaw(key);
        if (isMissing(rawValue)) {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Required environment variable "${formatKeyForError(key)}" is missing or empty.`
            );
        }
    }

    const valueConverter = new ValueConverter(envapter);
    const value =
        schema !== undefined
            ? (valueConverter.convertWithSchema(key, schema, fallback, hasFallback) as TFallback)
            : valueConverter.convertValue(key, fallback, converter, hasFallback);

    cache.set(cacheKey, value);
    return value;
}
