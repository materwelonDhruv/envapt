import { EnvaptError, EnvaptErrorCodes } from '../../infra/Error';
import { decoratorCacheKey, resolveDecoratorValue } from '../resolveDecoratorValue';

import type { EnvKeyInput } from '../../types';
import type { DecoratorConfig } from '../resolveDecoratorValue';

/* v8 ignore start -- @preserve the tsc stage3-emit tests cover these because oxc (vitest's transform) leaves context.name unset on modern accessor decorators */
export function createAccessorDecorator<TFallback>(key: EnvKeyInput, config: DecoratorConfig<TFallback>) {
    return function <This, Value>(
        _target: ClassAccessorDecoratorTarget<This, Value>,
        context: ClassAccessorDecoratorContext<This, Value>
    ): ClassAccessorDecoratorResult<This, Value> {
        const name: string | symbol | undefined = context.name;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- a broken Stage 3 transform can leave context.name unset, which would collapse every accessor to one cache key
        if (name === undefined) {
            throw new EnvaptError(
                EnvaptErrorCodes.InvalidUserDefinedConfig,
                'The runtime did not provide the accessor name to @Envapt, this Stage 3 decorator transform is unsupported.'
            );
        }
        const propKey = String(name);

        return {
            get(this: This): Value {
                const self = this as object;
                // some transforms (oxc) leave context.static unset
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
