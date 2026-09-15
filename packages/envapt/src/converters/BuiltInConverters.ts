/* eslint-disable @typescript-eslint/unbound-method */

import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

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

// WHATWG input[type=email] pattern. Full RFC 5322 rejects addresses people use.
// eslint-disable-next-line security/detect-unsafe-regex -- bounded quantifiers, each label anchored by a literal dot, linear match (no ReDoS)
export const EMAIL_RE = new RegExp(
    "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
    'u'
);

export const MAX_PORT = 65535;

// strict is for fallback strings and requires a unit. a raw env value with no unit reads as ms.
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

// Number('') returns 0
function parseTrimmedNumber(raw: string): number | undefined {
    const trimmed = raw.trim();
    return trimmed === '' ? undefined : Number(trimmed);
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- dispatch-table helper, the documented exception to the no-static-class rule
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
        const parsed = parseTrimmedNumber(raw);
        // integers past 2^53 lose precision as JS numbers
        return parsed !== undefined && Number.isSafeInteger(parsed) ? parsed : fallback;
    }

    static float(raw: string, fallback?: number): number | undefined {
        const parsed = parseTrimmedNumber(raw);
        // isNaN keeps Infinity valid, matching the number converter.
        return parsed !== undefined && !Number.isNaN(parsed) ? parsed : fallback;
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
            // `/pattern/flags` form
            const match = raw.match(new RegExp(String.raw`^\/(.+)\/([gimsuvy]*)$`));
            if (match) return new RegExp(match[1] as string, match[2]);

            return new RegExp(raw);
        } catch {
            return fallback;
        }
    }

    static date(raw: string, fallback?: Date): Date | undefined {
        if (new RegExp(String.raw`^\d+$`).test(raw)) {
            const timestamp = parseInt(raw, 10);
            const parsed = new Date(timestamp);
            return Number.isNaN(parsed.getTime()) ? fallback : parsed;
        }

        // Date also parses loose, engine-specific formats
        const isoRegex = new RegExp(String.raw`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$`, 'u');
        if (!isoRegex.test(raw)) return fallback;

        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? fallback : parsed;
    }

    static time(raw: string, fallback?: TimeFallback): number | undefined {
        const parsedRaw = parseTimeString(raw);
        if (parsedRaw !== undefined) return parsedRaw;

        if (typeof fallback === 'number') return fallback;
        if (typeof fallback === 'string') {
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

    static port(raw: string, fallback?: number): number | undefined {
        const parsed = parseTrimmedNumber(raw);
        // 0 is the ephemeral-bind wildcard
        return parsed !== undefined && Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= MAX_PORT
            ? parsed
            : fallback;
    }

    static email(raw: string, fallback?: string): string | undefined {
        return EMAIL_RE.test(raw) ? raw : fallback;
    }

    static processArrayConverter(raw: string, config: ArrayOf, strict = false): unknown[] {
        if (raw.trim() === '') return [];

        const trimmedItems = raw.split(config.delimiter).map((item) => String(item).trim());

        // strict rejects an empty item that the default filter below drops silently
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
            time: BuiltInConverters.time,
            port: BuiltInConverters.port,
            email: BuiltInConverters.email
        } as const;

        return converters[type];
    }
}
