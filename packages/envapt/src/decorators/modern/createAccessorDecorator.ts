import { EnvaptError, EnvaptErrorCodes } from '../../Error';
import { resolveDecoratorValue } from '../resolveDecoratorValue';

import type { EnvKeyInput } from '../../types';
import type { DecoratorConfig } from '../resolveDecoratorValue';

export function createAccessorDecorator<TFallback>(key: EnvKeyInput, config: DecoratorConfig<TFallback>) {
    return function <This, Value>(
        _target: ClassAccessorDecoratorTarget<This, Value>,
        context: ClassAccessorDecoratorContext<This, Value>
    ): ClassAccessorDecoratorResult<This, Value> {
        const propKey = String(context.name);

        return {
            get(this: This): Value {
                // `this` is the constructor for a static accessor and the instance if not that, so read the name off each
                const className = context.static ? (this as { name: string }).name : (this as object).constructor.name;
                const cacheKey = `${className}.${propKey}`;
                return resolveDecoratorValue(key, config, cacheKey) as Value;
            },
            set(): void {
                throw new EnvaptError(
                    EnvaptErrorCodes.InvalidUserDefinedConfig,
                    `Cannot assign to "${propKey}". @Envapt accessor properties resolve from the environment and are read-only.`
                );
            }
        };
    };
}
