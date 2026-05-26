/* eslint-disable @typescript-eslint/unbound-method */

import { EnvaptError, EnvaptErrorCodes } from './Error';

import type {
    ArrayConverter,
    BuiltInConverter,
    BuiltInConverterFunction,
    JsonValue,
    MapOfConverterFunctions,
    TimeFallback,
    TimeUnit
} from './Types';

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
const TIME_STRICT_RE = new RegExp(String.raw`^(\d+)(ms|s|m|h|d|w)$`, 'u');

/**
 * Parse a time string (e.g. `"30s"`, `"1.5h"`) into milliseconds.
 *
 * @param input - The string to parse.
 * @param strict - When `true`, require an explicit unit and disallow decimals (used for fallback strings).
 *                 When `false` (default), allow decimals and treat missing unit as `ms` (used for raw env values).
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

    static array(raw: string, fallback?: string[], delimiter = ','): string[] | undefined {
        if (raw.trim() === '') return [];
        const arr = raw
            .split(delimiter)
            .map((item) => item.trim())
            .filter(Boolean);
        return arr.length ? arr : fallback;
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
            // String fallback is held to the stricter format: explicit unit, integer value.
            const parsedFallback = parseTimeString(fallback, true);
            if (parsedFallback === undefined) {
                throw new EnvaptError(
                    EnvaptErrorCodes.MalformedTimeFallback,
                    `Time-string fallback "${fallback}" is not a valid format. Expected <integer><unit> where unit is one of: ms, s, m, h, d, w.`
                );
            }
            return parsedFallback;
        }
        return undefined;
    }

    /**
     * Process array with custom converter config
     */
    static processArrayConverter(raw: string, fallback: unknown, config: ArrayConverter): unknown[] | undefined {
        if (raw.trim() === '') return [];

        const items = raw
            .split(config.delimiter)
            .map((item) => String(item).trim())
            .filter(Boolean);

        // If no items after split, return fallback if provided
        if (!items.length) return fallback ? (fallback as unknown[]) : undefined;

        // If no type specified, return as string array
        const type = config.type;
        if (!type) return items;

        // Convert each item using the specified type
        const converter = BuiltInConverters.getConverter(type);
        return items.map((item) => {
            const converted = converter(item, undefined);
            return converted ?? item;
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
            array: BuiltInConverters.array,
            url: BuiltInConverters.url,
            regexp: BuiltInConverters.regexp,
            date: BuiltInConverters.date,
            time: BuiltInConverters.time
        } as const;

        return converters[type];
    }
}
