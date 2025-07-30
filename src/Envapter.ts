import { config } from 'dotenv';

import { BuiltInConverters } from './BuiltInConverters';
import { Parser, type EnvapterService } from './Parser';

/**
 * Internal cache for environment variables and computed values
 * @internal
 */
export const EnvaptCache = new Map<string, unknown>();

/**
 * @internal
 */
enum Primitive {
  String,
  Number,
  Boolean,
  BigInt,
  Symbol
}

/**
 * Environment types supported by Envapter
 * @public
 */
export enum Environment {
  Development,
  Staging,
  Production
}

/**
 * Main configuration class for environment variable management.
 *
 * Provides both static and instance methods for retrieving typed environment variables
 * with support for template resolution, multiple .env files, and environment detection.
 *
 * Extend your own classes from this to define properties with \@Envapt decorators and provide access to environment variables methods.
 *
 * @example
 * ```ts
 * // Static usage
 * const port = Envapter.getNumber('PORT', 3000);
 * const url = Envapter.get('API_URL', 'http://localhost');
 *
 * // Instance usage
 * const env = new Envapter();
 * const dbUrl = env.get('DATABASE_URL', 'sqlite://memory');
 * ```
 *
 * @public
 */
export class Envapter implements EnvapterService {
  private static readonly parser = new Parser(new Envapter());
  private static _envPaths: string[] = ['.env']; // default path

  // Environment handling
  private static internalEnvironment = this.determineEnvironment(
    this.get('ENVIRONMENT', this.get('ENV', this.get('NODE_ENV', 'development')))
  );

  /**
   * Set custom .env file paths. Accepts either a single path or array of paths.
   * Setting new paths clears the cache and reloads environment variables.
   *
   * @param paths - Single file path or array of file paths to load
   *
   * @example
   * ```ts
   * // Single file
   * Envapter.envPaths = '.env.production';
   *
   * // Multiple files (loaded in order)
   * Envapter.envPaths = ['.env', '.env.local', '.env.production'];
   * ```
   */
  static set envPaths(paths: string[] | string) {
    this._envPaths = Array.isArray(paths) ? paths : [paths];

    // clear cache to force reload with new path
    EnvaptCache.clear();
    void this.config;

    // reset internal environment to force re-evaluation
    this.internalEnvironment = this.determineEnvironment(
      this.get('ENVIRONMENT', this.get('ENV', this.get('NODE_ENV', 'development')))
    );
  }

  /**
   * Get currently configured .env file paths
   * @returns Array of file paths being loaded
   */
  static get envPaths(): string[] {
    return this._envPaths;
  }

  private static determineEnvironment(env: string | Environment): Environment {
    if (typeof env === 'string') {
      switch (env.toLowerCase()) {
        case 'production':
          return Environment.Production;
        case 'staging':
          return Environment.Staging;
        default:
          return Environment.Development;
      }
    }

    return env;
  }

  /**
   * Set the application environment. Accepts either Environment enum or string value.
   *
   * @param env - Environment value ('development', 'staging', 'production') or Environment enum
   *
   * @example
   * ```ts
   * Envapter.environment = Environment.Production;
   * Envapter.environment = 'staging';
   * ```
   */
  static set environment(env: string | Environment) {
    this.internalEnvironment = this.determineEnvironment(env);
  }

  /**
   * Get the current application environment
   * @returns Current environment enum value
   */
  static get environment(): Environment {
    return this.internalEnvironment;
  }

  /**
   * Check if the current environment is production
   * @returns true if environment is production
   */
  static get isProduction(): boolean {
    return this.internalEnvironment === Environment.Production;
  }

  /**
   * Check if the current environment is staging
   * @returns true if environment is staging
   */
  static get isStaging(): boolean {
    return this.internalEnvironment === Environment.Staging;
  }

  /**
   * Check if the current environment is development
   * @returns true if environment is development
   */
  static get isDevelopment(): boolean {
    return this.internalEnvironment === Environment.Development;
  }

  private static get config(): Map<string, unknown> {
    if (EnvaptCache.size === 0) {
      // create isolated environment object to avoid mutating process.env
      const isolatedEnv: Record<string, string> = { ...(process.env as Record<string, string>) };

      try {
        // load _envPath file from custom path into isolated environment object
        config({ path: this._envPaths, quiet: true, processEnv: isolatedEnv });
      } catch {
        // do nothing
      }
      // populate the Map with global environment variables
      for (const [key, value] of Object.entries(isolatedEnv)) EnvaptCache.set(key, value);
    }

    return EnvaptCache;
  }

  private static _get(key: string, type: Primitive = Primitive.String, def?: unknown): unknown {
    const rawVal = this.config.get(key) as string | number | boolean;
    if (!rawVal) return def;

    const parsed = this.parser.resolveTemplate(key, String(rawVal));

    switch (type) {
      case Primitive.String: {
        return BuiltInConverters.string(parsed, def as string);
      }

      case Primitive.Number: {
        return BuiltInConverters.number(parsed, def as number);
      }

      case Primitive.Boolean: {
        return BuiltInConverters.boolean(parsed, def as boolean);
      }

      case Primitive.BigInt: {
        return BuiltInConverters.bigint(parsed, def as bigint);
      }

      case Primitive.Symbol: {
        return BuiltInConverters.symbol(parsed, def as symbol);
      }

      default: {
        return BuiltInConverters.string(parsed, def as string);
      }
    }
  }

  /**
   * Get a string environment variable with optional fallback.
   * Supports template variable resolution using ${VAR} syntax.
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found
   * @returns The environment variable value or default
   *
   * @example
   * ```ts
   * const apiUrl = Envapter.get('API_URL', 'http://localhost:3000');
   * ```
   */
  static get(key: string, def?: string): string {
    return this._get(key, Primitive.String, def) as string;
  }

  /**
   * Get a number environment variable with optional fallback.
   * Automatically converts string values to numbers.
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found or cannot be converted
   * @returns The environment variable value as number or default
   *
   * @example
   * ```ts
   * const port = Envapter.getNumber('PORT', 3000);
   * ```
   */
  static getNumber(key: string, def?: number): number {
    return this._get(key, Primitive.Number, def) as number;
  }

  /**
   * Get a boolean environment variable with optional fallback.
   * Recognizes: `1`, `yes`, `true` as **true**; `0`, `no`, `false` as **false** (case-insensitive).
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found or cannot be converted
   * @returns The environment variable value as boolean or default
   *
   * @example
   * ```ts
   * const isProduction = Envapter.getBoolean('IS_PRODUCTION', false);
   * ```
   */
  static getBoolean(key: string, def?: boolean): boolean {
    return this._get(key, Primitive.Boolean, def) as boolean;
  }

  /**
   * Get a bigint environment variable with optional fallback.
   * Automatically converts string values to bigint.
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found or cannot be converted
   * @returns The environment variable value as bigint or default
   *
   * @example
   * ```ts
   * const largeNumber = Envapter.getBigInt('LARGE_NUMBER', 123456789012345678901234567890n);
   * ```
   */
  static getBigInt(key: string, def?: bigint): bigint {
    return this._get(key, Primitive.BigInt, def) as bigint;
  }

  /**
   * Get a symbol environment variable with optional fallback.
   * Creates a symbol from the string value.
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found
   * @returns The environment variable value as symbol or default
   *
   * @example
   * ```ts
   * const uniqueKey = Envapter.getSymbol('UNIQUE_KEY', Symbol('default'));
   * ```
   */
  static getSymbol(key: string, def?: symbol): symbol {
    return this._get(key, Primitive.Symbol, def) as symbol;
  }

  get(key: string, def?: string): string {
    return Envapter._get(key, Primitive.String, def) as string;
  }

  getNumber(key: string, def?: number): number {
    return Envapter._get(key, Primitive.Number, def) as number;
  }

  getBoolean(key: string, def?: boolean): boolean {
    return Envapter._get(key, Primitive.Boolean, def) as boolean;
  }

  getBigInt(key: string, def?: bigint): bigint {
    return Envapter._get(key, Primitive.BigInt, def) as bigint;
  }

  getSymbol(key: string, def?: symbol): symbol {
    return Envapter._get(key, Primitive.Symbol, def) as symbol;
  }

  /**
   * Get raw environment variable value without parsing or conversion.
   *
   * @internal
   */
  getRaw(key: string): string | undefined {
    return Envapter.config.get(key) as string | undefined;
  }
}
