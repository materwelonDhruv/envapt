import { decoratorCacheKey, resolveDecoratorValue } from './resolveDecoratorValue';
import { EnvaptError, EnvaptErrorCodes } from '../Error';

import type { DecoratorConfig } from './resolveDecoratorValue';
import type { EnvKeyInput } from '../types';

export function createPropertyDecorator<TFallback>(
    key: EnvKeyInput,
    config: DecoratorConfig<TFallback>
): PropertyDecorator {
    return function (target: object, prop: string | symbol): void {
        const propKey = String(prop);
        const isStatic = typeof target === 'function';
        // owner is the constructor either way: target itself for a static member, target.constructor for an instance one
        const owner = isStatic ? target : target.constructor;
        const cacheKey = decoratorCacheKey(owner, isStatic, propKey);

        Object.defineProperty(target, propKey, {
            get: function () {
                return resolveDecoratorValue(key, config, cacheKey);
            },
            set(): void {
                throw new EnvaptError(
                    EnvaptErrorCodes.InvalidUserDefinedConfig,
                    `Cannot assign to "${propKey}". @Envapt properties resolve from the environment and are read-only.`
                );
            },
            configurable: false,
            enumerable: true
        });
    };
}
