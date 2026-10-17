import { Converters, ValueConverter } from '../converters';
import { readRequired } from '../core/engine';
import { cache } from '../core/state';
import { Envapter } from '../engine/Envapter';

import type { StandardSchemaV1 } from '../infra/StandardSchema';
import type { EnvaptConverter, EnvKeyInput, RequiredField } from '../types';

export interface DecoratorConfig<TFallback> {
    fallback: TFallback | undefined;
    converter: EnvaptConverter<TFallback> | undefined;
    hasFallback: boolean;
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

export function resolveDecoratorValue<TFallback>(
    key: EnvKeyInput,
    config: DecoratorConfig<TFallback>,
    cacheKey: string
): TFallback | undefined {
    const { fallback, converter, hasFallback, required, schema } = config;

    // has() because a resolved value can be undefined
    if (cache.has(cacheKey)) return cache.get(cacheKey) as TFallback | undefined;

    const valueConverter = new ValueConverter(new Envapter());
    let value: TFallback | undefined;
    if (schema !== undefined) {
        value = valueConverter.convertWithSchema(key, schema, fallback, hasFallback) as TFallback;
    } else if (required) {
        // a required read never passes a fallback to the converter
        value = readRequired(key, (converter ?? Converters.String) as RequiredField) as TFallback;
    } else {
        value = valueConverter.convertValue(key, fallback, converter, hasFallback);
    }

    cache.set(cacheKey, value);
    return value;
}
