import { EnvapterBase } from './EnvapterBase';

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
 * Mixin for environment detection and checking methods
 * @internal
 */
export class EnvironmentMethods extends EnvapterBase {
  protected static _environment: Environment | undefined;

  protected static determineEnvironment(env?: string | Environment): void {
    const environment =
      env ?? this.getRawValue('ENVIRONMENT', this.getRawValue('ENV', this.getRawValue('NODE_ENV', 'development')));

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

  private static getRawValue(key: string, fallback: string): string {
    return (this.config.get(key) as string) || fallback;
  }

  /**
   * Get the current application environment
   */
  static get environment(): Environment {
    if (this._environment === undefined) {
      this.determineEnvironment();
    }
    return this._environment as Environment;
  }

  /**
   * Set the application environment. Accepts either Environment enum or string value.
   */
  static set environment(env: string | Environment) {
    this.determineEnvironment(env);
  }

  /**
   * @see {@link EnvironmentMethods.environment}
   */
  get environment(): Environment {
    return EnvironmentMethods.environment;
  }

  /**
   * @see {@link EnvironmentMethods.environment}
   */
  set environment(env: string | Environment) {
    EnvironmentMethods.determineEnvironment(env);
  }

  /**
   * Check if the current environment is production
   */
  static get isProduction(): boolean {
    return this.environment === Environment.Production;
  }

  /**
   * @see {@link EnvironmentMethods.isProduction}
   */
  get isProduction(): boolean {
    return EnvironmentMethods.environment === Environment.Production;
  }

  /**
   * Check if the current environment is staging
   */
  static get isStaging(): boolean {
    return this.environment === Environment.Staging;
  }

  /**
   * @see {@link EnvironmentMethods.isStaging}
   */
  get isStaging(): boolean {
    return EnvironmentMethods.environment === Environment.Staging;
  }

  /**
   * Check if the current environment is development
   */
  static get isDevelopment(): boolean {
    return this.environment === Environment.Development;
  }

  /**
   * @see {@link EnvironmentMethods.isDevelopment}
   */
  get isDevelopment(): boolean {
    return EnvironmentMethods.environment === Environment.Development;
  }

  protected static override refreshCache(): void {
    super.refreshCache();
    this._environment = undefined; // re-evaluate environment on next access
  }
}
