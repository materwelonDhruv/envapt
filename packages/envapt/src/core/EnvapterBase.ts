import process from 'node:process';

import { loadDotenv } from '../Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { Validator } from '../Validators';

import type { DotenvConfigOptions } from '../Dotenv';
import type { EnvKeyInput } from '../Types';

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
    protected static _envPathsExplicitlySet = false;
    protected static _userDefinedDotenvConfig: DotenvConfigOptions = {};

    /**
     * Set custom .env file paths. Accepts either a single path or array of paths.
     * Setting new paths clears the cache and reloads environment variables.
     *
     * When set, this takes absolute precedence. The dotenv-flow auto-cascade and any
     * {@link configureProfiles} configuration are ignored.
     */
    static set envPaths(paths: string[] | string) {
        const newPaths = Array.isArray(paths) ? paths : [paths];
        Validator.validateEnvFilesExist(newPaths);

        this._envPaths = newPaths;
        this._envPathsExplicitlySet = true;
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
    static set dotenvConfig(config: DotenvConfigOptions) {
        Validator.validateDotenvConfig(config);
        this._userDefinedDotenvConfig = config;
        this.refreshCache();
    }

    /**
     * Get current dotenv configuration options
     */
    static get dotenvConfig(): DotenvConfigOptions {
        return this._userDefinedDotenvConfig;
    }

    protected static refreshCache(): void {
        EnvaptCache.clear();
        void this.config; // reload config to repopulate cache
    }

    /**
     * Resolve the effective `.env` paths to load. Default implementation just returns the
     * explicit `_envPaths` array; subclasses (`EnvironmentMethods`) override to layer in the
     * dotenv-flow cascade and any {@link configureProfiles} overrides when `envPaths` was
     * never explicitly set.
     * @internal
     */
    protected static resolveEffectivePaths(): string[] {
        /* v8 ignore next -- @preserve */
        return this._envPaths;
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

            // Path resolution (outside the try below). Surfaces EnvaptError early when an
            // explicitly configured profile path is missing. dotenv parse errors stay caught.
            const effectivePaths = this.resolveEffectivePaths();

            try {
                loadDotenv({
                    path: effectivePaths,
                    processEnv: isolatedEnv,
                    ...this._userDefinedDotenvConfig
                });
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
