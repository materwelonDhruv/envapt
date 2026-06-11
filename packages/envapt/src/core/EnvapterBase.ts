import { debugVerbose, getDebugLevel, setDebugLevel } from '../Debug';
import { loadDotenv } from '../Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { bindRuntimeFromSource } from '../runtime';
import { UnboundEnvSource } from '../sources/UnboundEnvSource';
import { Validator } from '../Validators';

import type { DebugLevel } from '../Debug';
import type { EnvFileOptions } from '../Dotenv';
import type { EnvKeyInput, EnvSource, FileEnvSource } from '../types';

/** @internal */
export const EnvaptCache = new Map<string, unknown>();

/** @internal */
export abstract class EnvapterBase {
    protected static _envPaths: string[] = ['.env'];
    protected static _envPathsExplicitlySet = false;
    protected static _baseDir: string | undefined = undefined;
    protected static _userDefinedEnvFileOptions: EnvFileOptions = {};
    protected static _strict = false;
    protected static _syncProcessEnv = false;
    // Loader-written keys only (collisions skipped). Refilled on every cache rebuild.
    protected static _dotenvAddedKeys: Set<string> = new Set<string>();
    // Unbound by default so non-Node builds throw NoSourceBound on read until useSource() is called.
    // NodeEnvapter's static block binds NodeEnvSource when referenced, so `import 'envapt'` needs no setup.
    protected static _source: EnvSource = new UnboundEnvSource();

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
     * Set the debug log level. Defaults to `silent`. When unset, reads `ENVAPT_DEBUG` from the
     * bound source on first access; the setter overrides any env-var value. Output goes to stderr
     * on Node (the console elsewhere), prefixed with `[envapt]`.
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

    // No baseDir: candidate returned unchanged so the source resolves it against its own default
    // (process.cwd() on Node). Resolution goes through the source to keep this class node-free.
    protected static resolveAgainstBase(candidate: string): string {
        const baseDir = EnvapterBase._baseDir;
        if (baseDir === undefined) return candidate;
        const source = EnvapterBase._source;
        /* v8 ignore next -- @preserve callers are all file-gated, so the source is never bare here */
        if (!source.supportsFiles) return candidate;
        return source.resolvePath(baseDir, candidate);
    }

    // File-based config (envPaths/baseDir/configureProfiles) is meaningless without a filesystem;
    // throw instead of silently ignoring it on the browser or Workers. Narrows the source so callers
    // can reach the file capabilities (resolvePath/normalizeBaseDir) after the check.
    protected static assertFileApiSupported(api: string, source: EnvSource): asserts source is FileEnvSource {
        if (!source.supportsFiles) {
            throw new EnvaptError(
                EnvaptErrorCodes.FileApiUnsupported,
                `${api} requires a filesystem-backed source; the bound source does not support .env files.`
            );
        }
    }

    // Existence via the bound source instead of fs.existsSync/accessSync: a file "exists" when the
    // source can read it.
    protected static sourceFileExists(path: string): boolean {
        const source = EnvapterBase._source;
        /* v8 ignore next -- @preserve every caller is file-gated, so this never sees a bare source */
        if (!source.supportsFiles) return false;
        return source.readFile(path, 'utf8') !== undefined;
    }

    protected static refreshCache(): void {
        EnvaptCache.clear();
        EnvapterBase._dotenvAddedKeys = new Set();
        debugVerbose('cache cleared, reloading config');
        void this.config; // getter rebuilds the cache as a side effect
    }

    protected static mirrorToProcessEnv(): void {
        if (EnvapterBase._dotenvAddedKeys.size === 0) return;
        const source = EnvapterBase._source;
        /* v8 ignore next -- @preserve dotenv keys only accumulate under a file source, so the delta implies supportsFiles here */
        if (!source.supportsFiles) return;
        const mirrored: Record<string, string> = {};
        for (const key of EnvapterBase._dotenvAddedKeys) {
            const value = EnvaptCache.get(key);
            /* v8 ignore next -- @preserve loader only writes strings; defensive against future cache contents */
            if (typeof value !== 'string') continue;
            mirrored[key] = value;
            debugVerbose(`mirrored ${key} to the ambient environment`);
        }
        source.writeVars(mirrored);
        debugVerbose(`mirrored ${EnvapterBase._dotenvAddedKeys.size} keys to the ambient environment`);
    }

    // Default returns the explicit `_envPaths`; EnvironmentMethods overrides to layer the dotenv-flow
    // cascade + configureProfiles when envPaths was never explicitly set.
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
            if (source.supportsFiles) {
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
     * Bind the environment {@link EnvSource}. On Node the entry binds {@link NodeEnvSource} for you
     * (a `process.env` snapshot plus the `.env` cascade); on the browser or Workers, pass a
     * `ManualEnvSource` / `WorkerEnvSource` (or any `EnvSource`) before reading. Clears and rebuilds
     * the cache.
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
