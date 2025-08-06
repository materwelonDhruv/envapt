import { AdvancedMethods } from './core/AdvancedMethods.ts';

export { EnvaptCache } from './core/EnvapterBase.ts';
export { Environment } from './core/EnvironmentMethods.ts';

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
export class Envapter extends AdvancedMethods {
  /**
   * Tagged template literal for resolving environment variables in template strings.
   *
   * @example
   * ```ts
   * // Given API_HOST=api.example.com and API_PORT=8080 in environment
   * const endpoint = Envapter.resolve`Connecting to ${'API_HOST'}:${'API_PORT'}`;
   * // Returns: "Connecting to api.example.com:8080"
   *
   * // Works with template variables in .env too:
   * // API_URL=https://${API_HOST}:${API_PORT}
   * const message = Envapter.resolve`Service endpoint: ${'API_URL'}`;
   * // Returns: "Service endpoint: https://api.example.com:8080"
   * ```
   */
  static resolve(strings: TemplateStringsArray, ...keys: string[]): string {
    return strings.reduce((result, string, i) => {
      const envKey = keys[i];
      const envValue = envKey ? super.get(envKey, '') : '';
      return result + string + envValue;
    }, '');
  }

  /**
   * @see {@link Envapter.resolve}
   */
  resolve(strings: TemplateStringsArray, ...keys: string[]): string {
    return Envapter.resolve(strings, ...keys);
  }
}
