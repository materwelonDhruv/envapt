import process from 'node:process';

import { debugVerbose, getDebugLevel, setDebugLevel } from '../Debug';
import { loadDotenv } from '../Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { Validator } from '../Validators';

import type { DebugLevel } from '../Debug';
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
    protected static _strict = false;

    /**
     * Enable or disable strict mode. Default `false`. Setting refreshes the cache so
     * previously-cached converted values get re-evaluated under the new rule.
     */
    static set strict(value: boolean) {
        // `this._strict = value` would create an own property on the subclass that invoked the
        // setter; readers walking up from `PrimitiveMethods` would still see the base default.
        // Pin the write to the base class so the flag is canonical across the chain.
        EnvapterBase._strict = value;
        // `this.refreshCache()` so subclass overrides of `resolveEffectivePaths` (the
        // dotenv-flow cascade on `EnvironmentMethods`) are honored on the rebuild.
        this.refreshCache();
    }

    static get strict(): boolean {
        return EnvapterBase._strict;
    }

    /**
     * Set the debug log level. Defaults to `silent`. When unset, reads `ENVAPT_DEBUG` from
     * `process.env` on first access; the setter overrides any env-var value. Output goes
     * to stderr prefixed with `[envapt]`.
     */
    static set debug(level: DebugLevel) {
        setDebugLevel(level);
    }

    static get debug(): DebugLevel {
        return getDebugLevel();
    }

    protected static treatAsMissing(value: string | undefined): boolean {
        if (value === undefined || value === '') return true;
        if (EnvapterBase._strict && value.trim() === '') return true;
        return false;
    }

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
        debugVerbose('cache cleared, reloading config');
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
            debugVerbose(`effective .env paths: ${effectivePaths.length === 0 ? '(none)' : effectivePaths.join(', ')}`);

            try {
                loadDotenv({
                    ...this._userDefinedDotenvConfig,
                    path: effectivePaths,
                    processEnv: isolatedEnv
                });
            } catch {}
            // populate the Map with global environment variables
            for (const [key, value] of Object.entries(isolatedEnv)) EnvaptCache.set(key, value);
            debugVerbose(`cache populated: ${EnvaptCache.size} keys total`);
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
