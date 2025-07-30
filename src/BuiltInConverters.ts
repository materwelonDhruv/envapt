/* eslint-disable @typescript-eslint/unbound-method */
import { EnvaptError, EnvaptErrorCodes } from './Error';
import { Validator } from './Validators';

import type { ArrayConverter, BuiltInConverter, BuiltInConverterReturnType } from './Types';

/**
 * Built-in converter implementations
 * @internal
 */
export class BuiltInConverters {
  static string(raw: string | undefined, fallback?: string): string | undefined {
    return raw ?? fallback;
  }

  static number(raw: string | undefined, fallback?: number): number | undefined {
    if (raw === undefined) return fallback;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  static boolean(raw: string | undefined, fallback?: boolean): boolean | undefined {
    if (raw === undefined) return fallback;
    const lower = raw.toLowerCase().trim();

    const truthyValues = ['1', 'yes', 'true', 'on'];
    const falsyValues = ['0', 'no', 'false', 'off'];

    if (truthyValues.includes(lower)) return true;
    if (falsyValues.includes(lower)) return false;
    return fallback;
  }

  static bigint(raw: string | undefined, fallback?: bigint): bigint | undefined {
    if (raw === undefined) return fallback;
    try {
      return BigInt(raw);
    } catch {
      return fallback;
    }
  }

  static symbol(raw: string | undefined, fallback?: symbol): symbol | undefined {
    return raw ? Symbol(raw) : fallback;
  }

  static integer(raw: string | undefined, fallback?: number): number | undefined {
    if (raw === undefined) return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  static float(raw: string | undefined, fallback?: number): number | undefined {
    if (raw === undefined) return fallback;
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  static json<ParsedJson = unknown>(raw: string | undefined, fallback?: ParsedJson): ParsedJson | undefined {
    if (raw === undefined) return fallback;
    try {
      return JSON.parse(raw) as ParsedJson;
    } catch {
      return fallback;
    }
  }

  static array(raw: string | undefined, fallback?: string[], delimiter = ','): string[] | undefined {
    if (raw === undefined) return fallback;
    if (raw.trim() === '') return [];
    return raw
      .split(delimiter)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  static url(raw: string | undefined, fallback?: URL): URL | undefined {
    if (raw === undefined) return fallback;
    try {
      return new URL(raw);
    } catch {
      return fallback;
    }
  }

  static regexp(raw: string | undefined, fallback?: RegExp): RegExp | undefined {
    if (raw === undefined) return fallback;
    try {
      // Handle flags if provided in format: /pattern/flags
      const match = raw.match(/^\/(.+)\/([gimsuvy]*)$/);
      if (match) return new RegExp(match[1] as string, match[2]);

      return new RegExp(raw);
    } catch {
      return fallback;
    }
  }

  static date(raw: string | undefined, fallback?: Date): Date | undefined {
    if (raw === undefined) return fallback;

    // Try parsing as timestamp first (if it's all digits)
    if (/^\d+$/.test(raw)) {
      const timestamp = parseInt(raw, 10);
      const parsed = new Date(timestamp);
      return Number.isNaN(parsed.getTime()) ? fallback : parsed;
    }

    // Try parsing as regular date string
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }

  static time(raw: string | undefined, fallback?: number): number | undefined {
    if (raw === undefined) return fallback;

    // Match formats like: 5s, 30m, 2h, 500ms, 1000 (plain number treated as ms)
    // eslint-disable-next-line security/detect-unsafe-regex
    const match = raw.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/u);
    if (!match) return fallback;

    const [, numStr, unit = 'ms'] = match;
    if (!numStr) return fallback;

    const value = Number.parseFloat(numStr);

    if (Number.isNaN(value)) return fallback;

    const SECONDS_TO_MS = 1000;
    const SECONDS_PER_MINUTE = 60;
    const MINUTES_PER_HOUR = 60;
    const MINUTES_TO_MS = SECONDS_PER_MINUTE * SECONDS_TO_MS;
    const HOURS_TO_MS = MINUTES_PER_HOUR * MINUTES_TO_MS;

    if (unit === 'ms') return value;
    if (unit === 's') return value * SECONDS_TO_MS;
    if (unit === 'm') return value * MINUTES_TO_MS;
    if (unit === 'h') return value * HOURS_TO_MS;
    return fallback;
  }

  /**
   * Process array with custom converter config
   */
  static processArrayConverter(
    raw: string | undefined,
    fallback: unknown,
    config: ArrayConverter
  ): unknown[] | undefined {
    if (raw === undefined) {
      if (Array.isArray(fallback)) return fallback as unknown[];
      throw new EnvaptError(
        EnvaptErrorCodes.InvalidFallback,
        `ArrayConverter requires that the fallback be an array, got ${typeof fallback}`
      );
    }

    if (raw.trim() === '') return [];

    const items = raw
      .split(config.delimiter)
      .map((item) => String(item).trim())
      .filter(Boolean);

    // If no type specified, return as string array
    if (!config.type) return items;

    // Convert each item using the specified type
    const converter = BuiltInConverters.getConverter(config.type);
    return items.map((item) => {
      const converted = converter(item, undefined);
      return converted ?? item;
    });
  }

  /**
   * Get the converter function for a built-in converter type
   */
  static getConverter<FallbackType extends BuiltInConverter>(
    type: FallbackType
  ): (
    raw: string | undefined,
    fallback?: BuiltInConverterReturnType[FallbackType]
  ) => BuiltInConverterReturnType[FallbackType] {
    const converters = {
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

    const converter = converters[type];

    if (!Validator.isValidConverterFunction(converter)) {
      throw new EnvaptError(EnvaptErrorCodes.InvalidBuiltInConverter, `Unknown built-in converter: ${type as string}`);
    }

    return converter;
  }
}
