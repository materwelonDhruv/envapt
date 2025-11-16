import process from 'node:process';

import { config } from 'dotenv';

import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { Validator } from '../Validators';

import type { EnvKeyInput, PermittedDotenvConfig } from '../Types';

/**
 * Base cache for environment variables and computed values
 * @internal
 */
export const EnvaptCache = new Map<string, unknown>();

/**
 * Base class for environment variable management
 * Handles configuration, caching, and basic environment loading
 * @internal
 */
export abstract class EnvapterBase {
    protected static _envPaths: string[] = ['.env']; // default path
    protected static _userDefinedDotenvConfig: PermittedDotenvConfig = { quiet: true };

    /**
     * Set custom .env file paths. Accepts either a single path or array of paths.
     * Setting new paths clears the cache and reloads environment variables.
     */
    static set envPaths(paths: string[] | string) {
        const newPaths = Array.isArray(paths) ? paths : [paths];
        Validator.validateEnvFilesExist(newPaths);

        this._envPaths = newPaths;
        this.refreshCache();
    }

    /**
     * Get currently configured .env file paths
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
     */
    static get dotenvConfig(): PermittedDotenvConfig {
        return this._userDefinedDotenvConfig;
    }

    protected static refreshCache(): void {
        EnvaptCache.clear();
        void this.config; // reload config to repopulate cache
    }

    protected static resolveKeyInput(keyInput: EnvKeyInput): { key: string; value: string | undefined } {
        const keys = Array.isArray(keyInput) ? keyInput : [keyInput];
        const normalizedKeys = keys as readonly string[];

        if (normalizedKeys.length === 0) {
            throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'At least one environment key must be provided.');
        }

        if (normalizedKeys.some((k) => typeof k !== 'string')) {
            throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'Environment keys must be strings.');
        }

        if (normalizedKeys.some((k) => k.trim() === '')) {
            throw new EnvaptError(EnvaptErrorCodes.InvalidKeyInput, 'Environment keys cannot be empty strings.');
        }

        for (const candidate of normalizedKeys) {
            const value = this.config.get(candidate) as string | undefined;
            if (value !== undefined) {
                return { key: candidate, value };
            }
        }

        return { key: normalizedKeys[0] as string, value: undefined };
    }

    protected static get config(): Map<string, unknown> {
        if (EnvaptCache.size === 0) {
            // create isolated environment object to avoid mutating process.env
            const isolatedEnv: Record<string, string> = { ...(process.env as Record<string, string>) };

            try {
                // load _envPath file from custom path into isolated environment object
                config({ path: this._envPaths, processEnv: isolatedEnv, ...this._userDefinedDotenvConfig });
            } catch {}
            // populate the Map with global environment variables
            for (const [key, value] of Object.entries(isolatedEnv)) EnvaptCache.set(key, value);
        }

        return EnvaptCache;
    }

    /**
     * Get raw environment variable value without parsing or conversion.
     */
    getRaw(key: EnvKeyInput): string | undefined {
        return EnvapterBase.resolveKeyInput(key).value;
    }
}
