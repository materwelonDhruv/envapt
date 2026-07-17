import { AdvancedMethods } from '../core';
import { resolveRequired } from '../core/AdvancedMethods';
import { resolveKeyInput, templateResolver } from '../core/engine';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';

import type { EnvKeyInput } from '../types';

export { Environment } from '../core';

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
     * @see {@link https://envapt.materwelon.dev/docs/templates#the-resolve-tagged-template}
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
     * Assert that one or more environment variables are present and non-empty after template
     * resolution. Throws `MissingEnvValue` listing every missing key. A whitespace-only value
     * counts as missing only under strict mode.
     *
     * For a typed required read in functional code, use `Envapter.getRequired(key, converter)`.
     *
     * @example
     * ```ts
     * Envapter.require('DATABASE_URL');
     * Envapter.require('DATABASE_URL', 'API_KEY', 'SENTRY_DSN');
     * ```
     */
    static require(...keys: [string, ...string[]]): void {
        const missing = keys.filter((k) => resolveRequired(resolveKeyInput(k), templateResolver).value === undefined);

        if (missing.length > 0) {
            throw new EnvaptError(
                EnvaptErrorCodes.MissingEnvValue,
                `Missing required environment variables: ${missing.join(', ')}.`
            );
        }
    }

    /**
     * @see {@link Envapter.require}
     */
    require(...keys: [string, ...string[]]): void {
        Envapter.require(...keys);
    }

    /**
     * Check whether `key` has a value, with the same missing semantics as `getRequired`.
     * Under strict mode an unresolvable template in an ordered key list ends the scan early
     * and counts as absent. Returns `true` exactly when a required read of the same key
     * finds a value.
     *
     * @example
     * ```ts
     * if (!Envapter.has('DATABASE_URL')) throw new MyStartupError('DATABASE_URL');
     * ```
     * @see {@link https://envapt.materwelon.dev/docs/envapter#fail-fast-on-missing-values}
     */
    static has(key: EnvKeyInput): boolean {
        try {
            return resolveRequired(resolveKeyInput(key), templateResolver).value !== undefined;
        } catch (error) {
            // under strict an unresolvable template throws MissingEnvValue, and that read counts as absent
            if (error instanceof EnvaptError && error.code === EnvaptErrorCodes.MissingEnvValue) return false;
            throw error;
        }
    }

    /**
     * @see {@link Envapter.has}
     */
    has(key: EnvKeyInput): boolean {
        return Envapter.has(key);
    }
}
