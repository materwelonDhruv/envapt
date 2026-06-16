import { EnvaptError, EnvaptErrorCodes } from '../../infra/Error';
import { decoratorCacheKey, resolveDecoratorValue } from '../resolveDecoratorValue';

import type { EnvKeyInput } from '../../types';
import type { DecoratorConfig } from '../resolveDecoratorValue';

export function createPropertyDecorator<TFallback>(
    key: EnvKeyInput,
    config: DecoratorConfig<TFallback>
): PropertyDecorator {
    return function (target: object, prop: string | symbol): void {
        const propKey = String(prop);
        const isStatic = typeof target === 'function';
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
