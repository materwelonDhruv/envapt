import { createPropertyDecorator } from './createPropertyDecorator';
import { Converters } from '../converters';

import type { ConverterToken } from '../converters';
import type { EnvKeyInput, TimeFallback } from '../types';

function sugar<TFallback>(
    converter: ConverterToken,
    key: EnvKeyInput,
    fallback: TFallback | undefined
): PropertyDecorator {
    return createPropertyDecorator<TFallback>(key, {
        converter,
        fallback,
        hasFallback: fallback !== undefined,
        required: false,
        schema: undefined
    });
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Boolean, fallback })`.
 * @public
 */
export function EnvBool(key: EnvKeyInput, fallback?: boolean): PropertyDecorator {
    return sugar(Converters.Boolean, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Number, fallback })`.
 * @public
 */
export function EnvNum(key: EnvKeyInput, fallback?: number): PropertyDecorator {
    return sugar(Converters.Number, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.String, fallback })`.
 * @public
 */
export function EnvStr(key: EnvKeyInput, fallback?: string): PropertyDecorator {
    return sugar(Converters.String, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Time, fallback })`. The fallback is a
 * millisecond number or a time string (`'15m'`); the resolved value is always milliseconds.
 * @public
 */
export function EnvTime(key: EnvKeyInput, fallback?: TimeFallback): PropertyDecorator {
    return sugar(Converters.Time, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Url, fallback })`. The fallback is a `URL`
 * instance, not a URL string.
 * @public
 */
export function EnvUrl(key: EnvKeyInput, fallback?: URL): PropertyDecorator {
    return sugar(Converters.Url, key, fallback);
}
