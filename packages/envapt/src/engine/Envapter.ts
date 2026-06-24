import { AdvancedMethods } from '../core';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

export { EnvaptCache, Environment } from '../core';

/**
 * Main configuration class for environment variable management.
 *
 * Provides both static and instance methods for retrieving typed environment variables
 * with support for template resolution, multiple .env files, and environment detection.
 *
 * Extend your own classes from this to define properties with \@Envapt decorators and get access to environment-variable methods.
 *
 * @example
 * ```ts
 * // Static usage
 * const port = Envapter.getNumber('PORT', 3000);
 * const url = Envapter.get('API_URL', 'http://localhost');
 * const replica = Envapter.get(['READONLY_URL', 'DATABASE_URL'], 'sqlite://memory');
 *
 * // Instance usage
 * const env = new Envapter();
 * const dbUrl = env.get('DATABASE_URL', 'sqlite://memory');
 * const primaryHost = env.get(['PRIMARY_HOST', 'SECONDARY_HOST']);
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
        const strict = Envapter.strict;
        return strings.reduce((result, string, i) => {
            const envKey = keys[i];
            if (!envKey) return result + string;
            const raw = super.get(envKey, '');
            if (strict && raw.trim() === '') {
                throw new EnvaptError(
                    EnvaptErrorCodes.MissingEnvValue,
                    `Cannot resolve template variable "\${${envKey}}": value is missing or empty.`
                );
            }
            return result + string + raw;
        }, '');
    }

    /**
     * @see {@link Envapter.resolve}
     */
    resolve(strings: TemplateStringsArray, ...keys: string[]): string {
        return Envapter.resolve(strings, ...keys);
    }

    /**
     * Assert that one or more environment variables are present and non-empty (post-trim,
     * after template resolution). Throws `MissingEnvValue` listing every missing key.
     *
     * For typed fail-fast in functional code, use `Envapter.getUsing(key, { converter, required: true })`.
     *
     * @example
     * ```ts
     * Envapter.require('DATABASE_URL');
     * Envapter.require('DATABASE_URL', 'API_KEY', 'SENTRY_DSN');
     * ```
     */
    static require(...keys: [string, ...string[]]): void {
        const missing: string[] = [];
        for (const k of keys) {
            if (Envapter.resolveAndValidate(k) === undefined) missing.push(k);
        }

        if (missing.length > 0) {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Missing required environment variables: ${missing.join(', ')}.`
            );
        }
    }

    private static resolveAndValidate(key: string): string | undefined {
        const { value } = this.resolveKeyInput(key);
        if (value === undefined) return undefined;
        const resolved = this.templateResolver.resolveTemplate(key, value);
        if (resolved.trim() === '') return undefined;
        return resolved;
    }

    /**
     * @see {@link Envapter.require}
     */
    require(...keys: [string, ...string[]]): void {
        Envapter.require(...keys);
    }
}
