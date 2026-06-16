import { resolveDecoratorValue } from './resolveDecoratorValue';
import { EnvaptError, EnvaptErrorCodes } from '../Error';

import type { DecoratorConfig } from './resolveDecoratorValue';
import type { EnvKeyInput } from '../types';

export function createPropertyDecorator<TFallback>(
    key: EnvKeyInput,
    config: DecoratorConfig<TFallback>
): PropertyDecorator {
    return function (target: object, prop: string | symbol): void {
        const propKey = String(prop);
        // Distinguishing constructor (static) from prototype (instance) keeps same-named static and instance properties from colliding in the cache.
        const className = typeof target === 'function' ? target.name : target.constructor.name;
        const cacheKey = `${className}.${propKey}`;

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
