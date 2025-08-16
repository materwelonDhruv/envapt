/* eslint-disable @typescript-eslint/unbound-method */

import type {
  ArrayConverter,
  BuiltInConverter,
  BuiltInConverterFunction,
  JsonValue,
  MapOfConverterFunctions,
  TimeUnit
} from './Types';

/**
 * Built-in converter implementations
 * @internal
 */
export class BuiltInConverters {
  static string(raw: string, fallback?: string): string | undefined {
    return String(raw) || fallback;
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
      const match = raw.match(/^\/(.+)\/([gimsuvy]*)$/);
      if (match) return new RegExp(match[1] as string, match[2]);

      return new RegExp(raw);
    } catch {
      return fallback;
    }
  }

  static date(raw: string, fallback?: Date): Date | undefined {
    // Try parsing as timestamp first (if it's all digits)
    if (/^\d+$/.test(raw)) {
      const timestamp = parseInt(raw, 10);
      const parsed = new Date(timestamp);
      return Number.isNaN(parsed.getTime()) ? fallback : parsed;
    }

    // Only accept ISO 8601 date strings (strict format)
    // eslint-disable-next-line security/detect-unsafe-regex
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/u;
    if (!isoRegex.test(raw)) return fallback;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }

  static time(raw: string, fallback?: number): number | undefined {
    // eslint-disable-next-line security/detect-unsafe-regex
    const match = raw.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/u);
    if (!match) return fallback;

    const [, numStr, capturedUnit] = match;
    if (!numStr) return fallback;

    const value = Number.parseFloat(numStr);
    if (Number.isNaN(value)) return fallback;

    const unit: TimeUnit = (capturedUnit ?? 'ms') as TimeUnit;

    const SECONDS_TO_MS = 1000;
    const SECONDS_PER_MINUTE = 60;
    const MINUTES_PER_HOUR = 60;
    const MINUTES_TO_MS = SECONDS_PER_MINUTE * SECONDS_TO_MS;
    const HOURS_TO_MS = MINUTES_PER_HOUR * MINUTES_TO_MS;

    if (unit === 'ms') return value;
    if (unit === 's') return value * SECONDS_TO_MS;
    if (unit === 'm') return value * MINUTES_TO_MS;
    return value * HOURS_TO_MS;
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
