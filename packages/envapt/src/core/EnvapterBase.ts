import { cache, state } from './state';
import { Validator } from '../engine/Validators';
import { debugVerbose, getDebugLevel, setDebugLevel } from '../infra/Debug';
import { loadDotenv } from '../infra/Dotenv';
import { EnvaptError, EnvaptErrorCodes } from '../infra/Error';
import { bindRuntimeFromSource } from '../infra/runtime';

import type { DebugLevel } from '../infra/Debug';
import type { EnvKeyInput, FileApiMode, FileCapableSource, Source } from '../types';

/** @internal */
export abstract class EnvapterBase {
    /**
     * Enable or disable strict mode. Default `false`. Setting refreshes the cache so
     * previously-cached converted values get re-evaluated under the new rule.
     */
    static set strict(value: boolean) {
        state.strict = value;
        // rebuild via `this` so the subclass `resolveEffectivePaths` override is honored (EnvapterBase would skip it).
        this.refreshCache();
    }

    static get strict(): boolean {
        return state.strict;
    }

    /**
     * Set the debug log level. Defaults to `silent`. When unset, reads `ENVAPT_DEBUG` from the
     * bound source on first access. The setter overrides any env-var value. Output goes to stderr
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
     * are preserved. With `true`, the file value wins in both the cache and the mirror.
     *
     * Flipping `false → true` mirrors the existing tracked delta immediately (no cache
     * refresh). Flipping `true → false` is one-way: previously mirrored keys remain in
     * `process.env` until the process exits.
     */
    static set syncProcessEnv(value: boolean) {
        Validator.validateSyncProcessEnv(value);
        const previous = state.syncProcessEnv;
        state.syncProcessEnv = value;
        if (!previous && value && cache.size > 0) this.mirrorToProcessEnv();
    }

    static get syncProcessEnv(): boolean {
        return state.syncProcessEnv;
    }

    /**
     * On the portable build, this controls the filesystem-only config APIs (`envPaths`, `baseDir`,
     * `envFileOptions`, `configureProfiles`, `resetProfiles`). `'warn'` (the default) warns once and
     * no-ops, `'throw'` throws {@link EnvaptError} `FileApiUnsupported`. The node build runs these
     * APIs normally and this value has no effect there.
     */
    static set fileApiMode(mode: FileApiMode) {
        Validator.validateFileApiMode(mode);
        // no refreshCache, this only gates the portable stubs.
        state.fileApiMode = mode;
    }

    static get fileApiMode(): FileApiMode {
        return state.fileApiMode;
    }

    protected static treatAsMissing(value: string | undefined): boolean {
        if (value === undefined || value === '') return true;
        if (state.strict && value.trim() === '') return true;
        return false;
    }

    // No baseDir: candidate returned unchanged so the source resolves it against its own default
    // (process.cwd() on Node). Resolution goes through the source to keep this class node-free.
    protected static resolveAgainstBase(candidate: string): string {
        const baseDir = state.baseDir;
        if (baseDir === undefined) return candidate;
        const source = state.source;
        /* v8 ignore next -- @preserve callers are all file-gated, so the source is never bare here */
        if (!source.supportsFiles) return candidate;
        return source.resolvePath(baseDir, candidate);
    }

    // File-based config (envPaths/baseDir/configureProfiles) is meaningless without a filesystem, and
    // it throws instead of silently ignoring it on the browser or Workers. Narrows the source so callers
    // can reach the file capabilities (resolvePath/normalizeBaseDir) after the check.
    protected static assertFileApiSupported(api: string, source: Source): asserts source is FileCapableSource {
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
        const source = state.source;
        /* v8 ignore next -- @preserve every caller is file-gated, so this never sees a bare source */
        if (!source.supportsFiles) return false;
        return source.readFile(path, 'utf8') !== undefined;
    }

    protected static refreshCache(): void {
        cache.clear();
        state.cacheBuilt = false;
        state.dotenvAddedKeys = new Set<string>();
        debugVerbose('cache cleared, reloading config');
        void this.config; // getter rebuilds the cache as a side effect
    }

    protected static mirrorToProcessEnv(): void {
        if (state.dotenvAddedKeys.size === 0) return;
        const source = state.source;
        /* v8 ignore next -- @preserve dotenv keys only accumulate under a file source, so the delta implies supportsFiles here */
        if (!source.supportsFiles) return;
        const mirrored: Record<string, string> = {};
        for (const key of state.dotenvAddedKeys) {
            const value = cache.get(key);
            /* v8 ignore next -- @preserve loader only writes strings, defensive against future cache contents */
            if (typeof value !== 'string') continue;
            mirrored[key] = this.resolveForMirror(key, value);
            debugVerbose(`mirrored ${key} to the ambient environment`);
        }
        source.writeVars(mirrored);
        debugVerbose(`mirrored ${state.dotenvAddedKeys.size} keys to the ambient environment`);
    }

    // The template resolver is defined in PrimitiveMethods, and EnvapterBase can't call it without an
    // import cycle, so the mirror expands ${VAR} through this override.
    protected static resolveForMirror(_key: string, value: string): string {
        /* v8 ignore next -- @preserve overridden by PrimitiveMethods on every concrete class */
        return value;
    }

    // Default returns the explicit `state.envPaths`. EnvironmentMethods overrides to layer the dotenv-flow
    // cascade + configureProfiles when envPaths was never explicitly set.
    protected static resolveEffectivePaths(): string[] {
        /* v8 ignore next -- @preserve */
        return state.envPaths.map((p) => this.resolveAgainstBase(p));
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
        if (!state.cacheBuilt) {
            const source = state.source;
            // Clone so the loader and downstream reads never mutate the source's backing object.
            const isolatedEnv: Record<string, string> = { ...source.readVars() };

            let added = new Set<string>();
            // Sources without a filesystem (injected objects on the browser or Workers) skip the
            // .env cascade, profiles, and envPaths. Only the readVars() snapshot populates the cache.
            if (source.supportsFiles) {
                debugVerbose(`base dir: ${state.baseDir ?? 'working directory'}`);
                // Outside the try below so a missing configured profile path surfaces its EnvaptError. Only dotenv parse errors stay caught.
                const effectivePaths = this.resolveEffectivePaths();
                debugVerbose(
                    `effective .env paths: ${effectivePaths.length === 0 ? '(none)' : effectivePaths.join(', ')}`
                );
                try {
                    added = loadDotenv({
                        ...state.userDefinedEnvFileOptions,
                        path: effectivePaths,
                        processEnv: isolatedEnv,
                        readFile: source.readFile.bind(source)
                    });
                } catch {}
            }
            state.dotenvAddedKeys = added;
            for (const [key, value] of Object.entries(isolatedEnv)) cache.set(key, value);
            debugVerbose(`cache populated: ${cache.size} keys total`);
            // set before mirroring, whose template expansion reads config and would re-enter this build otherwise
            state.cacheBuilt = true;
            if (state.syncProcessEnv) this.mirrorToProcessEnv();
        }

        return cache;
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
     * Bind the environment {@link Source}. On Node the entry binds {@link FileSource} for you
     * (a `process.env` snapshot plus the `.env` cascade). On the browser or Workers, pass a
     * `PortableSource` (or any `Source`) before reading. Clears and rebuilds the cache.
     */
    static useSource(source: Source): void {
        state.source = source;
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
