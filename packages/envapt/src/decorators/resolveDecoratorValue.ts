import { readOptional, readRequired } from '../core/engine';
import { cache } from '../core/state';

import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type { EnvaptConverter, EnvKeyInput, FallbackToken } from '../types';

export interface DecoratorConfig<TFallback> {
    fallback: TFallback | undefined;
    converter: EnvaptConverter<TFallback> | undefined;
    required: boolean;
    schema: StandardSchemaV1 | undefined;
}

const classIds = new WeakMap<object, number>();
let nextClassId = 0;

// keyed on the class object because two classes can share a name
export function decoratorCacheKey(owner: object, isStatic: boolean, prop: string): string {
    let id = classIds.get(owner);
    if (id === undefined) {
        id = nextClassId++;
        classIds.set(owner, id);
    }
    return `${id}.${isStatic ? 'static' : 'instance'}.${prop}`;
}

function tokenForFallback(fallback: unknown): FallbackToken {
    const fallbackType = typeof fallback;
    if (fallbackType === 'number' || fallbackType === 'boolean' || fallbackType === 'bigint') return fallbackType;
    return 'string';
}

export function resolveDecoratorValue<TFallback>(
    key: EnvKeyInput,
    config: DecoratorConfig<TFallback>,
    cacheKey: string
): TFallback | undefined {
    const { fallback, converter, required, schema } = config;

    // has() because a resolved value can be undefined
    if (cache.has(cacheKey)) return cache.get(cacheKey) as TFallback | undefined;

    const field = schema ?? converter ?? tokenForFallback(fallback);
    const value = required ? readRequired(key, field) : readOptional(key, field, fallback);

    cache.set(cacheKey, value);
    return value as TFallback | undefined;
}
