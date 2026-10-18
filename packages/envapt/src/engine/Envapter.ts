import { AdvancedMethods } from '../core';
import { findPresent } from '../core/engine';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { formatKeyForError, missingValues } from '../infra/failures';

import type { EnvKeyInput } from '../types';

export { ENVIRONMENT_KEYS, Environment } from '../core';

/**
 * Reads typed environment variables through static methods. It also expands `${VAR}` templates
 * and detects the environment. A class that extends it inherits every reader as a static, as in
 * `Config.getBoolean('MAINTENANCE_MODE')`.
 *
 * @example
 * ```ts
 * const port = Envapter.getAs('PORT', Converters.Port, 3000);
 * const apiUrl = Envapter.getAs('API_URL', Converters.Url, new URL('http://localhost:3000'));
 * const replicaUrl = Envapter.getAs(['READONLY_URL', 'DATABASE_URL'], Converters.Url);
 * ```
 *
 * @public
 */
export class Envapter extends AdvancedMethods {
    /**
     * Tagged template literal for resolving environment variables in template strings. A missing
     * value resolves to an empty string. In strict mode an empty or whitespace-only value throws
     * `MissingEnvValue`.
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
     *
     * // reads READONLY_URL when present, otherwise DATABASE_URL
     * const db = Envapter.resolve`Connecting to ${['READONLY_URL', 'DATABASE_URL']}`;
     * ```
     * @see {@link https://envapt.materwelon.dev/docs/templates#the-resolve-tagged-template}
     */
    static resolve(strings: TemplateStringsArray, ...keys: EnvKeyInput[]): string {
        const strict = Envapter.strict;
        return strings.reduce((result, string, i) => {
            const envKey = keys[i];
            if (!envKey) return result + string;
            const raw = super.get(envKey, '');
            if (strict && raw.trim() === '') {
                throw new EnvaptError(
                    EnvaptErrorCodes.MissingEnvValue,
                    `Cannot resolve template variable "\${${formatKeyForError(envKey)}}": value is missing or empty.`
                );
            }
            return result + string + raw;
        }, '');
    }

    /**
     * Assert that one or more environment variables are present and non-empty after template
     * resolution. Throws `MissingEnvValue` listing every missing key. A whitespace-only value
     * counts as missing only under strict mode. Each argument can be an ordered key list, which
     * passes when any of its keys has a value.
     *
     * For a typed required read in functional code, use `Envapter.getRequired(key, converter)`.
     *
     * @example
     * ```ts
     * Envapter.require('DATABASE_URL');
     * Envapter.require('DATABASE_URL', 'API_KEY', 'SENTRY_DSN');
     * Envapter.require(['READONLY_URL', 'DATABASE_URL'], 'API_KEY');
     * ```
     */
    static require(...keys: [EnvKeyInput, ...EnvKeyInput[]]): void {
        const missing = keys.filter((key) => findPresent(key) === undefined);
        if (missing.length > 0) throw missingValues(missing);
    }

    /**
     * Check whether `key` has a value. An unset or empty value counts as missing, the same as in
     * `getRequired`. Under strict mode, a value whose `${VAR}` can't resolve counts as missing too,
     * and an ordered key list returns `false` at that key without checking the later ones.
     *
     * @example
     * ```ts
     * const cache = Envapter.has('REDIS_URL') ? createRedisCache() : createMemoryCache();
     * ```
     * @see {@link https://envapt.materwelon.dev/docs/required-values#getrequired-require-and-has}
     */
    static has(key: EnvKeyInput): boolean {
        try {
            return findPresent(key) !== undefined;
        } catch (error) {
            // strict mode throws MissingEnvValue for an unresolvable template
            if (error instanceof EnvaptError && error.code === EnvaptErrorCodes.MissingEnvValue) return false;
            throw error;
        }
    }
}
