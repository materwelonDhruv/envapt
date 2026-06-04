import { dirname, isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { debugVerbose, getDebugLevel, setDebugLevel } from '../Debug';
import { loadDotenv } from '../Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { bindRuntimeFromSource, setRuntimeSink } from '../runtime';
import { NodeEnvSource } from '../sources/NodeEnvSource';
import { Validator } from '../Validators';

import type { DebugLevel } from '../Debug';
import type { EnvFileOptions } from '../Dotenv';
import type { EnvKeyInput, EnvSource } from '../types';

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
    protected static _envPaths: string[] = ['.env'];
    protected static _envPathsExplicitlySet = false;
    protected static _baseDir: string | undefined = undefined;
    protected static _userDefinedEnvFileOptions: EnvFileOptions = {};
    protected static _strict = false;
    protected static _syncProcessEnv = false;
    // Loader-written keys only (collisions skipped). Refilled on every cache rebuild.
    protected static _dotenvAddedKeys: Set<string> = new Set<string>();
    protected static _source: EnvSource = new NodeEnvSource();

    // So ENVAPT_DEBUG and stderr output work on a plain `import 'envapt'`, before any useSource() call.
    static {
        setRuntimeSink((line) => process.stderr.write(`${line}\n`));
        bindRuntimeFromSource(EnvapterBase._source);
    }

    /**
     * Enable or disable strict mode. Default `false`. Setting refreshes the cache so
     * previously-cached converted values get re-evaluated under the new rule.
     */
    static set strict(value: boolean) {
        // Anchored to EnvapterBase: `this._strict` would write an own-property on the subclass that base readers miss.
        EnvapterBase._strict = value;
        // `this`, not EnvapterBase: rebuild via the subclass so its `resolveEffectivePaths` override is honored.
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
        // Anchored to EnvapterBase: `this._syncProcessEnv` would write an own-property on the subclass that base readers miss.
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
        Validator.validateEnvFilesExist(
            newPaths.map((p) => this.resolveAgainstBase(p)),
            (p) => EnvapterBase.sourceFileExists(p)
        );

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
     * Set a base directory that relative `.env` paths resolve against instead of
     * `process.cwd()`: the auto-cascade, {@link configureProfiles} paths, and relative
     * `envPaths`. Absolute paths always bypass it. Pass a directory, or a module URL
     * (`import.meta.url`, ESM) / `import.meta.dirname` / `__dirname` (CJS) to anchor
     * resolution next to the calling file regardless of launch directory.
     *
     * Set this before `envPaths` so relative `envPaths` validate against the right directory.
     * Unset (`undefined`) restores `process.cwd()` resolution.
     */
    static set baseDir(value: string | URL | undefined) {
        EnvapterBase._baseDir = value === undefined ? undefined : this.normalizeBaseDir(value);
        this.refreshCache();
    }

    static get baseDir(): string | undefined {
        return EnvapterBase._baseDir;
    }

    // `file:` URLs resolve to their containing directory; plain paths (`import.meta.dirname`, `__dirname`) are taken as the directory.
    private static normalizeBaseDir(value: string | URL): string {
        if (value instanceof URL) return dirname(fileURLToPath(value));
        if (value.startsWith('file:')) return dirname(fileURLToPath(value));
        return resolve(value);
    }

    // No baseDir: path is returned unchanged so Node resolves it against process.cwd() (the historical default).
    protected static resolveAgainstBase(candidate: string): string {
        if (EnvapterBase._baseDir === undefined) return candidate;
        if (isAbsolute(candidate)) return candidate;
        return join(EnvapterBase._baseDir, candidate);
    }

    // Existence via the bound source instead of fs.existsSync/accessSync: a file "exists" when the
    // source can read it. A source without a filesystem reports everything missing.
    protected static sourceFileExists(path: string): boolean {
        return EnvapterBase._source.readFile?.(path, 'utf8') !== undefined;
    }

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
        void this.config; // getter rebuilds the cache as a side effect
    }

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
        return this._envPaths.map((p) => this.resolveAgainstBase(p));
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
            const source = EnvapterBase._source;
            // Clone so the loader and downstream reads never mutate the source's backing object.
            const isolatedEnv: Record<string, string> = { ...source.readVars() };

            let added = new Set<string>();
            // Sources without a filesystem (injected objects on the browser or Workers) skip the
            // .env cascade, profiles, and envPaths; only the readVars() snapshot populates the cache.
            if (source.supportsFiles && source.readFile) {
                // Outside the try below so a missing configured profile path surfaces its EnvaptError; only dotenv parse errors stay caught.
                const effectivePaths = this.resolveEffectivePaths();
                debugVerbose(
                    `effective .env paths: ${effectivePaths.length === 0 ? '(none)' : effectivePaths.join(', ')}`
                );
                try {
                    added = loadDotenv({
                        ...this._userDefinedEnvFileOptions,
                        path: effectivePaths,
                        processEnv: isolatedEnv,
                        readFile: source.readFile.bind(source)
                    });
                } catch {}
            }
            EnvapterBase._dotenvAddedKeys = added;
            for (const [key, value] of Object.entries(isolatedEnv)) EnvaptCache.set(key, value);
            debugVerbose(`cache populated: ${EnvaptCache.size} keys total`);
            if (EnvapterBase._syncProcessEnv) this.mirrorToProcessEnv();
        }

        return EnvaptCache;
    }

    /**
     * Eagerly load the `.env` cascade now instead of lazily on the first read. Idempotent: a no-op
     * once the cache is built. Useful before mirroring to `process.env` (see {@link syncProcessEnv}),
     * which is what the `envapt/config` side-effect entry does.
     */
    static load(): void {
        void this.config;
    }

    /**
     * Bind the environment {@link EnvSource}. Defaults to {@link NodeEnvSource} (a `process.env`
     * snapshot plus the `.env` cascade). Pass a `ManualEnvSource` (or any `EnvSource`) to seed
     * config from an injected object instead, e.g. on the browser. Clears and rebuilds the cache.
     */
    static useSource(source: EnvSource): void {
        EnvapterBase._source = source;
        bindRuntimeFromSource(source);
        this.refreshCache();
    }

    /**
     * Read an environment variable as its raw string, skipping parsing and conversion.
     */
    getRaw(key: EnvKeyInput): string | undefined {
        return EnvapterBase.resolveKeyInput(key).value;
    }
}
