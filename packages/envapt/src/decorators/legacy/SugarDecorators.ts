import { createPropertyDecorator } from './createPropertyDecorator';
import { Converters } from '../../converters';

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
 * @see {@link https://envapt.materwelon.dev/docs/decorators#shorthand-decorators}
 */
export function EnvBool(key: EnvKeyInput, fallback: boolean): EnvaptFieldDecorator<boolean>;
export function EnvBool(key: EnvKeyInput): EnvaptFieldDecorator<boolean | undefined>;
export function EnvBool(key: EnvKeyInput, fallback?: boolean): EnvaptFieldDecorator<boolean | undefined> {
    return sugar(Converters.Boolean, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Number, fallback })`.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/decorators#shorthand-decorators}
 */
export function EnvNum(key: EnvKeyInput, fallback: number): EnvaptFieldDecorator<number>;
export function EnvNum(key: EnvKeyInput): EnvaptFieldDecorator<number | undefined>;
export function EnvNum(key: EnvKeyInput, fallback?: number): EnvaptFieldDecorator<number | undefined> {
    return sugar(Converters.Number, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.String, fallback })`.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/decorators#shorthand-decorators}
 */
export function EnvStr(key: EnvKeyInput, fallback: string): EnvaptFieldDecorator<string>;
export function EnvStr(key: EnvKeyInput): EnvaptFieldDecorator<string | undefined>;
export function EnvStr(key: EnvKeyInput, fallback?: string): EnvaptFieldDecorator<string | undefined> {
    return sugar(Converters.String, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Time, fallback })`. The fallback is a
 * millisecond number or a time string (`'15m'`), and the resolved value is always milliseconds.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/decorators#shorthand-decorators}
 */
export function EnvTime(key: EnvKeyInput, fallback: TimeFallback): EnvaptFieldDecorator<number>;
export function EnvTime(key: EnvKeyInput): EnvaptFieldDecorator<number | undefined>;
export function EnvTime(key: EnvKeyInput, fallback?: TimeFallback): EnvaptFieldDecorator<number | undefined> {
    return sugar(Converters.Time, key, fallback);
}

/**
 * Shorthand for `@Envapt(key, { converter: Converters.Url, fallback })`. The fallback is a `URL`
 * instance, not a URL string.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/decorators#shorthand-decorators}
 */
export function EnvUrl(key: EnvKeyInput, fallback: URL): EnvaptFieldDecorator<URL>;
export function EnvUrl(key: EnvKeyInput): EnvaptFieldDecorator<URL | undefined>;
export function EnvUrl(key: EnvKeyInput, fallback?: URL): EnvaptFieldDecorator<URL | undefined> {
    return sugar(Converters.Url, key, fallback);
}
