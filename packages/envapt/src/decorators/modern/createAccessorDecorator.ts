import { EnvaptError, EnvaptErrorCodes } from '../../infra/Error';
import { decoratorCacheKey, resolveDecoratorValue } from '../resolveDecoratorValue';

import type { EnvKeyInput } from '../../types';
import type { DecoratorConfig } from '../resolveDecoratorValue';

/* v8 ignore start -- @preserve oxc (vitest's transform) breaks modern accessor decorators (context.name unset), so the tsc stage3-emit harness covers these, not vitest */
export function createAccessorDecorator<TFallback>(key: EnvKeyInput, config: DecoratorConfig<TFallback>) {
    return function <This, Value>(
        _target: ClassAccessorDecoratorTarget<This, Value>,
        context: ClassAccessorDecoratorContext<This, Value>
    ): ClassAccessorDecoratorResult<This, Value> {
        const propKey = String(context.name);

        return {
            get(this: This): Value {
                const self = this as object;
                // derive static-ness from `this` (the class is a function, an instance is not) rather than
                // context.static, which some transformers (oxc) leave unset, collapsing every owner to Function
                const isStatic = typeof self === 'function';
                const owner = isStatic ? self : self.constructor;
                const cacheKey = decoratorCacheKey(owner, isStatic, propKey);
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
/* v8 ignore stop */
