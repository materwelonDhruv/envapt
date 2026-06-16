import { createAccessorDecorator } from './createAccessorDecorator';
import { Converters } from '../../converters';

import type { ConverterToken } from '../../converters';
import type { EnvaptAccessorDecorator, EnvKeyInput, TimeFallback } from '../../types';

function sugar<TFallback>(
    converter: ConverterToken,
    key: EnvKeyInput,
    fallback: TFallback | undefined
): EnvaptAccessorDecorator<TFallback> {
    // the runtime installer is a plain accessor decorator, so the cast only adds a
    // compile-time field-type constraint with no runtime counterpart
    return createAccessorDecorator<TFallback>(key, {
        converter,
        fallback,
        hasFallback: fallback !== undefined,
        required: false,
        schema: undefined
    }) as EnvaptAccessorDecorator<TFallback>;
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Boolean, fallback })`.
 * @public
 */
export function EnvBool(key: EnvKeyInput, fallback: boolean): EnvaptAccessorDecorator<boolean>;
export function EnvBool(key: EnvKeyInput): EnvaptAccessorDecorator<boolean | null>;
export function EnvBool(key: EnvKeyInput, fallback?: boolean): EnvaptAccessorDecorator<boolean | null> {
    return sugar(Converters.Boolean, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Number, fallback })`.
 * @public
 */
export function EnvNum(key: EnvKeyInput, fallback: number): EnvaptAccessorDecorator<number>;
export function EnvNum(key: EnvKeyInput): EnvaptAccessorDecorator<number | null>;
export function EnvNum(key: EnvKeyInput, fallback?: number): EnvaptAccessorDecorator<number | null> {
    return sugar(Converters.Number, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.String, fallback })`.
 * @public
 */
export function EnvStr(key: EnvKeyInput, fallback: string): EnvaptAccessorDecorator<string>;
export function EnvStr(key: EnvKeyInput): EnvaptAccessorDecorator<string | null>;
export function EnvStr(key: EnvKeyInput, fallback?: string): EnvaptAccessorDecorator<string | null> {
    return sugar(Converters.String, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Time, fallback })`. The fallback is a
 * millisecond number or a time string (`'15m'`), and the resolved value is always milliseconds.
 * @public
 */
export function EnvTime(key: EnvKeyInput, fallback: TimeFallback): EnvaptAccessorDecorator<number>;
export function EnvTime(key: EnvKeyInput): EnvaptAccessorDecorator<number | null>;
export function EnvTime(key: EnvKeyInput, fallback?: TimeFallback): EnvaptAccessorDecorator<number | null> {
    return sugar(Converters.Time, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Url, fallback })`. The fallback is a `URL`
 * instance, not a URL string.
 * @public
 */
export function EnvUrl(key: EnvKeyInput, fallback: URL): EnvaptAccessorDecorator<URL>;
export function EnvUrl(key: EnvKeyInput): EnvaptAccessorDecorator<URL | null>;
export function EnvUrl(key: EnvKeyInput, fallback?: URL): EnvaptAccessorDecorator<URL | null> {
    return sugar(Converters.Url, key, fallback);
}
