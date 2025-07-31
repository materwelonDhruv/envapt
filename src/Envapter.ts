import { config } from 'dotenv';

import { BuiltInConverters } from './BuiltInConverters';
import { Parser, type EnvapterService } from './Parser';
import { Validator } from './Validators';

import type { ConditionalReturn, PermittedDotenvConfig } from './Types';

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
  private static _userDefinedDotenvConfig: PermittedDotenvConfig = { quiet: true };

  // Environment handling
  private static _environment: Environment;

  static {
    this.determineEnvironment();
  }

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
    const newPaths = Array.isArray(paths) ? paths : [paths];
    Validator.validateEnvFilesExist(newPaths);

    this._envPaths = newPaths;
    this.refreshCache();
  }

  /**
   * Get currently configured .env file paths
   * @returns Array of file paths being loaded
   */
  static get envPaths(): string[] {
    return this._envPaths;
  }

  /**
   * Set custom dotenv configuration options.
   */
  static set dotenvConfig(config: PermittedDotenvConfig) {
    Validator.validateDotenvConfig(config);
    this._userDefinedDotenvConfig = config;
    this.refreshCache();
  }

  /**
   * Get current dotenv configuration options
   * @returns Current dotenv config object
   */
  static get dotenvConfig(): PermittedDotenvConfig {
    return this._userDefinedDotenvConfig;
  }

  private static refreshCache(): void {
    EnvaptCache.clear();
    void this.config; // reload config to repopulate cache
    this.determineEnvironment(); // re-evaluate environment
  }

  private static get config(): Map<string, unknown> {
    if (EnvaptCache.size === 0) {
      // create isolated environment object to avoid mutating process.env
      const isolatedEnv: Record<string, string> = { ...(process.env as Record<string, string>) };

      try {
        // load _envPath file from custom path into isolated environment object
        config({ path: this._envPaths, processEnv: isolatedEnv, ...this._userDefinedDotenvConfig });
      } catch {
        // do nothing
      }
      // populate the Map with global environment variables
      for (const [key, value] of Object.entries(isolatedEnv)) EnvaptCache.set(key, value);
    }

    return EnvaptCache;
  }

  private static _get<EnvVarReturnType, DefaultType extends EnvVarReturnType | undefined = undefined>(
    key: string,
    type: Primitive,
    def?: DefaultType
  ): ConditionalReturn<EnvVarReturnType, DefaultType> {
    const rawVal = this.config.get(key) as string | number | boolean;
    if (!rawVal) return def as ConditionalReturn<EnvVarReturnType, DefaultType>;

    const parsed = this.parser.resolveTemplate(key, String(rawVal));

    let result: EnvVarReturnType;
    if (type === Primitive.Number) result = BuiltInConverters.number(parsed, def as number) as EnvVarReturnType;
    else if (type === Primitive.Boolean) result = BuiltInConverters.boolean(parsed, def as boolean) as EnvVarReturnType;
    else if (type === Primitive.BigInt) result = BuiltInConverters.bigint(parsed, def as bigint) as EnvVarReturnType;
    else if (type === Primitive.Symbol) result = BuiltInConverters.symbol(parsed, def as symbol) as EnvVarReturnType;
    else result = BuiltInConverters.string(parsed, def as string) as EnvVarReturnType;

    return result as ConditionalReturn<EnvVarReturnType, DefaultType>;
  }

  private static determineEnvironment(env?: string | Environment): void {
    const environment = env ?? this.get('ENVIRONMENT', this.get('ENV', this.get('NODE_ENV', 'development')));

    if (typeof environment === 'string') {
      this._environment =
        environment.toLowerCase() === 'production'
          ? Environment.Production
          : environment === 'staging'
            ? Environment.Staging
            : Environment.Development;
    } else {
      this._environment = environment;
    }
  }

  /**
   * Get the current application environment
   * @returns Current environment enum value
   */
  static get environment(): Environment {
    return this._environment;
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
    this.determineEnvironment(env);
  }

  /**
   * @see {@link Envapter.environment}
   */
  get environment(): Environment {
    return Envapter._environment;
  }

  /**
   * @see {@link Envapter.environment}
   */
  set environment(env: string | Environment) {
    Envapter.determineEnvironment(env);
  }

  /**
   * Check if the current environment is production
   * @returns true if environment is production
   */
  static get isProduction(): boolean {
    return this._environment === Environment.Production;
  }

  /**
   * @see {@link Envapter.isProduction}
   */
  get isProduction(): boolean {
    return Envapter._environment === Environment.Production;
  }

  /**
   * Check if the current environment is staging
   * @returns true if environment is staging
   */
  static get isStaging(): boolean {
    return this._environment === Environment.Staging;
  }

  /**
   * @see {@link Envapter.isStaging}
   */
  get isStaging(): boolean {
    return Envapter._environment === Environment.Staging;
  }

  /**
   * Check if the current environment is development
   * @returns true if environment is development
   */
  static get isDevelopment(): boolean {
    return this._environment === Environment.Development;
  }

  /**
   * @see {@link Envapter.isDevelopment}
   */
  get isDevelopment(): boolean {
    return Envapter._environment === Environment.Development;
  }

  /**
   * Get a string environment variable with optional fallback.
   * Supports template variable resolution using ${VAR} syntax.
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found
   * @returns The environment variable value or default; if no default is provided, may return undefined
   *
   * @example
   * ```ts
   * const apiUrl = Envapter.get('API_URL', 'http://localhost:3000'); // returns string
   * const maybeMissing = Envapter.get('MAYBE_MISSING'); // returns string | undefined
   * ```
   */
  static get<Default extends string | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<string, Default> {
    return this._get(key, Primitive.String, def);
  }

  /**
   * @see {@link Envapter.get}
   */
  get<Default extends string | undefined = undefined>(key: string, def?: Default): ConditionalReturn<string, Default> {
    return Envapter._get(key, Primitive.String, def);
  }

  /**
   * Get a number environment variable with optional fallback.
   * Automatically converts string values to numbers.
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found or cannot be converted
   * @returns The environment variable value as number or default; if no default is provided, may return undefined
   */
  static getNumber<Default extends number | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<number, Default> {
    return this._get(key, Primitive.Number, def);
  }

  /**
   * @see {@link Envapter.getNumber}
   */
  getNumber<Default extends number | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<number, Default> {
    return Envapter._get(key, Primitive.Number, def);
  }

  /**
   * Get a boolean environment variable with optional fallback.
   * Recognizes: `1`, `yes`, `true` as **true**; `0`, `no`, `false` as **false** (case-insensitive).
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found or cannot be converted
   * @returns The environment variable value as boolean or default; if no default is provided, may return undefined
   */
  static getBoolean<Default extends boolean | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<boolean, Default> {
    return this._get(key, Primitive.Boolean, def);
  }

  /**
   * @see {@link Envapter.getBoolean}
   */
  getBoolean<Default extends boolean | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<boolean, Default> {
    return Envapter._get(key, Primitive.Boolean, def);
  }

  /**
   * Get a bigint environment variable with optional fallback.
   * Automatically converts string values to bigint.
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found or cannot be converted
   * @returns The environment variable value as bigint or default; if no default is provided, may return undefined
   */
  static getBigInt<Default extends bigint | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<bigint, Default> {
    return this._get(key, Primitive.BigInt, def);
  }

  /**
   * @see {@link Envapter.getBigInt}
   */
  getBigInt<Default extends bigint | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<bigint, Default> {
    return Envapter._get(key, Primitive.BigInt, def);
  }

  /**
   * Get a symbol environment variable with optional fallback.
   * Creates a symbol from the string value.
   *
   * @param key - Environment variable name
   * @param def - Default value if variable is not found
   * @returns The environment variable value as symbol or default; if no default is provided, may return undefined
   */
  static getSymbol<Default extends symbol | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<symbol, Default> {
    return this._get(key, Primitive.Symbol, def);
  }

  /**
   * @see {@link Envapter.getSymbol}
   */
  getSymbol<Default extends symbol | undefined = undefined>(
    key: string,
    def?: Default
  ): ConditionalReturn<symbol, Default> {
    return Envapter._get(key, Primitive.Symbol, def);
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
