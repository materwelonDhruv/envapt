/* eslint-disable @typescript-eslint/unbound-method */

import { EnvaptError, EnvaptErrorCodes } from '../Error';

import type { ArrayOf, CustomElementConverter } from './Converters';
import type {
    BuiltInConverter,
    BuiltInConverterFunction,
    JsonValue,
    MapOfConverterFunctions,
    TimeFallback,
    TimeUnit
} from '../types';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;
const MS_PER_HOUR = MINUTES_PER_HOUR * MS_PER_MINUTE;
const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;
const MS_PER_WEEK = DAYS_PER_WEEK * MS_PER_DAY;

const TIME_UNIT_MS: Record<TimeUnit, number> = {
    ms: 1,
    s: MS_PER_SECOND,
    m: MS_PER_MINUTE,
    h: MS_PER_HOUR,
    d: MS_PER_DAY,
    w: MS_PER_WEEK
};

const TIME_LOOSE_RE = new RegExp(String.raw`^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)?$`, 'u');
const TIME_STRICT_RE = new RegExp(String.raw`^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$`, 'u');

/**
 * Parse a time string (e.g. `"30s"`, `"1.5h"`) into milliseconds.
 *
 * @param input - The string to parse.
 * @param strict - When `true`, require an explicit unit (used for fallback strings).
 *                 When `false` (default), treat a missing unit as `ms` (used for raw env values). Both allow decimals.
 * @returns The duration in milliseconds, or `undefined` if the input does not match the expected format.
 * @internal
 */
function parseTimeString(input: string, strict = false): number | undefined {
    const match = input.match(strict ? TIME_STRICT_RE : TIME_LOOSE_RE);
    if (!match) return undefined;

    const [, numStr, capturedUnit] = match;
    if (!numStr) return undefined;

    const value = Number.parseFloat(numStr);
    if (Number.isNaN(value)) return undefined;

    const unit = (capturedUnit ?? 'ms') as TimeUnit;
    return value * TIME_UNIT_MS[unit];
}

/**
 * Built-in converter implementations
 * @internal
 */
export class BuiltInConverters {
    static string(raw: string, _fallback?: string): string | undefined {
        return String(raw);
    }

    static number(raw: string, fallback?: number): number | undefined {
        const parsed = Number(raw);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    static boolean(raw: string, fallback?: boolean): boolean | undefined {
        const lower = raw.toLowerCase().trim();

        const truthyValues = ['1', 'yes', 'true', 'on'];
        const falsyValues = ['0', 'no', 'false', 'off'];

        if (truthyValues.includes(lower)) return true;
        if (falsyValues.includes(lower)) return false;
        return fallback;
    }

    static bigint(raw: string, fallback?: bigint): bigint | undefined {
        try {
            return BigInt(raw);
        } catch {
            return fallback;
        }
    }

    static symbol(raw: string, fallback?: symbol): symbol | undefined {
        try {
            return raw ? Symbol.for(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    static integer(raw: string, fallback?: number): number | undefined {
        const parsed = Number.parseInt(raw, 10);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    static float(raw: string, fallback?: number): number | undefined {
        const parsed = Number.parseFloat(raw);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    static json(raw: string, fallback?: JsonValue): JsonValue | undefined {
        try {
            return JSON.parse(raw) as JsonValue;
        } catch {
            return fallback;
        }
    }

    static url(raw: string, fallback?: URL): URL | undefined {
        try {
            return new URL(raw);
        } catch {
            return fallback;
        }
    }

    static regexp(raw: string, fallback?: RegExp): RegExp | undefined {
        try {
            // Handle flags if provided in format: /pattern/flags
            const match = raw.match(new RegExp(String.raw`^\/(.+)\/([gimsuvy]*)$`));
            if (match) return new RegExp(match[1] as string, match[2]);

            return new RegExp(raw);
        } catch {
            return fallback;
        }
    }

    static date(raw: string, fallback?: Date): Date | undefined {
        // Try parsing as timestamp first (if it's all digits)
        if (new RegExp(String.raw`^\d+$`).test(raw)) {
            const timestamp = parseInt(raw, 10);
            const parsed = new Date(timestamp);
            return Number.isNaN(parsed.getTime()) ? fallback : parsed;
        }

        // Only accept ISO 8601 date strings (strict format)
        const isoRegex = new RegExp(String.raw`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$`, 'u');
        if (!isoRegex.test(raw)) return fallback;

        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? fallback : parsed;
    }

    static time(raw: string, fallback?: TimeFallback): number | undefined {
        const parsedRaw = parseTimeString(raw);
        if (parsedRaw !== undefined) return parsedRaw;

        // Raw didn't parse so apply fallback
        if (typeof fallback === 'number') return fallback;
        if (typeof fallback === 'string') {
            // A string fallback must name a unit; a unitless number is expressed as a number fallback, not a string.
            const parsedFallback = parseTimeString(fallback, true);
            if (parsedFallback === undefined) {
                throw new EnvaptError(
                    EnvaptErrorCodes.MalformedTimeFallback,
                    `Time-string fallback "${fallback}" is not a valid format. Expected <number><unit> where unit is one of: ms, s, m, h, d, w.`
                );
            }
            return parsedFallback;
        }
        return undefined;
    }

    /**
     * Process the raw env value for an {@link ArrayOf} configuration.
     *
     * Behaviour:
     * - Splits on `config.delimiter`, trims each item, and filters out empty entries.
     * - With a scalar element token: runs each item through the matching built-in converter.
     *   If any element returns `undefined`, throws `ArrayElementConversionFailed` with positional info.
     * - With a custom function element: runs each item through the function. Propagates user
     *   exceptions; treats `undefined` returns as conversion failures (same throw as scalar path).
     * - Returns `[]` when the raw value is empty/whitespace.
     * - When `strict` is true, throws `EmptyArrayElement` on any empty/whitespace item instead
     *   of silently filtering it out.
     */
    static processArrayConverter(raw: string, config: ArrayOf, strict = false): unknown[] {
        if (raw.trim() === '') return [];

        const trimmedItems = raw.split(config.delimiter).map((item) => String(item).trim());

        if (strict) {
            const emptyIdx = trimmedItems.findIndex((item) => item === '');
            if (emptyIdx !== -1) {
                throw new EnvaptError(
                    EnvaptErrorCodes.EmptyArrayElement,
                    `Array element at index ${emptyIdx} is empty or whitespace only (strict mode).`
                );
            }
        }

        const items = trimmedItems.filter(Boolean);

        if (!items.length) return [];

        const elementOf = config.of;

        if (typeof elementOf === 'function') {
            return items.map((item, index) => {
                const converter = elementOf as CustomElementConverter;
                const result = converter(item);
                if (result === undefined) {
                    throw new EnvaptError(
                        EnvaptErrorCodes.ArrayElementConversionFailed,
                        `Custom element converter returned undefined for item "${item}" at index ${index}.`
                    );
                }
                return result;
            });
        }

        const converter = BuiltInConverters.getConverter(elementOf);
        return items.map((item, index) => {
            const converted = converter(item, undefined);
            if (converted === undefined) {
                throw new EnvaptError(
                    EnvaptErrorCodes.ArrayElementConversionFailed,
                    `Element "${item}" at index ${index} could not be converted to ${elementOf}.`
                );
            }
            return converted;
        });
    }

    /**
     * Get the converter function for a built-in converter type
     */
    static getConverter<TFallback extends BuiltInConverter>(type: TFallback): BuiltInConverterFunction {
        const converters: MapOfConverterFunctions = {
            string: BuiltInConverters.string,
            number: BuiltInConverters.number,
            boolean: BuiltInConverters.boolean,
            integer: BuiltInConverters.integer,
            bigint: BuiltInConverters.bigint,
            symbol: BuiltInConverters.symbol,
            float: BuiltInConverters.float,
            json: BuiltInConverters.json,
            url: BuiltInConverters.url,
            regexp: BuiltInConverters.regexp,
            date: BuiltInConverters.date,
            time: BuiltInConverters.time
        } as const;

        return converters[type];
    }
}
