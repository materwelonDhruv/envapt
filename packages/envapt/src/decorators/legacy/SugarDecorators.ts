import { Converters } from '../../converters';
import { createPropertyDecorator } from '../createPropertyDecorator';

import type { ConverterToken } from '../../converters';
import type { EnvaptFieldDecorator, EnvKeyInput, TimeFallback } from '../../types';

function sugar<TFallback>(
    converter: ConverterToken,
    key: EnvKeyInput,
    fallback: TFallback | undefined
): EnvaptFieldDecorator<TFallback> {
    // the runtime installer is a plain (target, key) decorator, so the cast only adds a
    // compile-time field-type constraint with no runtime counterpart
    return createPropertyDecorator<TFallback>(key, {
        converter,
        fallback,
        hasFallback: fallback !== undefined,
        required: false,
        schema: undefined
    }) as EnvaptFieldDecorator<TFallback>;
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Boolean, fallback })`.
 * @public
 */
export function EnvBool(key: EnvKeyInput, fallback: boolean): EnvaptFieldDecorator<boolean>;
export function EnvBool(key: EnvKeyInput): EnvaptFieldDecorator<boolean | null>;
export function EnvBool(key: EnvKeyInput, fallback?: boolean): EnvaptFieldDecorator<boolean | null> {
    return sugar(Converters.Boolean, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Number, fallback })`.
 * @public
 */
export function EnvNum(key: EnvKeyInput, fallback: number): EnvaptFieldDecorator<number>;
export function EnvNum(key: EnvKeyInput): EnvaptFieldDecorator<number | null>;
export function EnvNum(key: EnvKeyInput, fallback?: number): EnvaptFieldDecorator<number | null> {
    return sugar(Converters.Number, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.String, fallback })`.
 * @public
 */
export function EnvStr(key: EnvKeyInput, fallback: string): EnvaptFieldDecorator<string>;
export function EnvStr(key: EnvKeyInput): EnvaptFieldDecorator<string | null>;
export function EnvStr(key: EnvKeyInput, fallback?: string): EnvaptFieldDecorator<string | null> {
    return sugar(Converters.String, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Time, fallback })`. The fallback is a
 * millisecond number or a time string (`'15m'`), and the resolved value is always milliseconds.
 * @public
 */
export function EnvTime(key: EnvKeyInput, fallback: TimeFallback): EnvaptFieldDecorator<number>;
export function EnvTime(key: EnvKeyInput): EnvaptFieldDecorator<number | null>;
export function EnvTime(key: EnvKeyInput, fallback?: TimeFallback): EnvaptFieldDecorator<number | null> {
    return sugar(Converters.Time, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Url, fallback })`. The fallback is a `URL`
 * instance, not a URL string.
 * @public
 */
export function EnvUrl(key: EnvKeyInput, fallback: URL): EnvaptFieldDecorator<URL>;
export function EnvUrl(key: EnvKeyInput): EnvaptFieldDecorator<URL | null>;
export function EnvUrl(key: EnvKeyInput, fallback?: URL): EnvaptFieldDecorator<URL | null> {
    return sugar(Converters.Url, key, fallback);
}
