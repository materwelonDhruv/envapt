import process from 'node:process';

import { debugVerbose, getDebugLevel, setDebugLevel } from '../Debug';
import { loadDotenv } from '../Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { Validator } from '../Validators';

import type { DebugLevel } from '../Debug';
import type { EnvFileOptions } from '../Dotenv';
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
    protected static _userDefinedEnvFileOptions: EnvFileOptions = {};
    protected static _strict = false;
    protected static _syncProcessEnv = false;
    // Loader-written keys only (collisions skipped). Refilled on every cache rebuild.
    protected static _dotenvAddedKeys: Set<string> = new Set<string>();

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

    /**
     * Opt-in mirror of dotenv-loaded keys back to `process.env`. Default `false`.
     *
     * Only keys the loader actually wrote are mirrored, so collision behavior follows
     * `envFileOptions.override`: with the default `false`, pre-existing `process.env` values
     * are preserved; with `true`, the file value wins in both the cache and the mirror.
     *
     * Flipping `false → true` mirrors the existing tracked delta immediately (no cache
     * refresh). Flipping `true → false` is one-way: previously mirrored keys remain in
     * `process.env` until the process exits.
     */
    static set syncProcessEnv(value: boolean) {
        Validator.validateSyncProcessEnv(value);
        const previous = EnvapterBase._syncProcessEnv;
        // Anchored to EnvapterBase: `this._syncProcessEnv = value` creates an own-property
        // on the subclass that readers walking up to the base would miss.
        EnvapterBase._syncProcessEnv = value;
        if (!previous && value && EnvaptCache.size > 0) this.mirrorToProcessEnv();
    }

    static get syncProcessEnv(): boolean {
        return EnvapterBase._syncProcessEnv;
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
    static set envFileOptions(config: EnvFileOptions) {
        Validator.validateEnvFileOptions(config);
        this._userDefinedEnvFileOptions = config;
        this.refreshCache();
    }

    /**
     * Get current dotenv configuration options
     */
    static get envFileOptions(): EnvFileOptions {
        return this._userDefinedEnvFileOptions;
    }

    protected static refreshCache(): void {
        EnvaptCache.clear();
        EnvapterBase._dotenvAddedKeys = new Set();
        debugVerbose('cache cleared, reloading config');
        void this.config; // reload config to repopulate cache
    }

    // Early-return on an empty delta so the verbose summary line is not emitted on a no-op.
    protected static mirrorToProcessEnv(): void {
        if (EnvapterBase._dotenvAddedKeys.size === 0) return;
        for (const key of EnvapterBase._dotenvAddedKeys) {
            const value = EnvaptCache.get(key);
            /* v8 ignore next -- @preserve loader only writes strings; defensive against future cache contents */
            if (typeof value !== 'string') continue;
            process.env[key] = value;
            debugVerbose(`mirrored ${key} to process.env`);
        }
        debugVerbose(`mirrored ${EnvapterBase._dotenvAddedKeys.size} keys to process.env`);
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

            let added = new Set<string>();
            try {
                added = loadDotenv({
                    ...this._userDefinedEnvFileOptions,
                    path: effectivePaths,
                    processEnv: isolatedEnv
                });
            } catch {}
            EnvapterBase._dotenvAddedKeys = added;
            // populate the Map with global environment variables
            for (const [key, value] of Object.entries(isolatedEnv)) EnvaptCache.set(key, value);
            debugVerbose(`cache populated: ${EnvaptCache.size} keys total`);
            if (EnvapterBase._syncProcessEnv) this.mirrorToProcessEnv();
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
