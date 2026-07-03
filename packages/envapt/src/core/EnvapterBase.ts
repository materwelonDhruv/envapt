import { ensureLoaded, mirrorToProcessEnv, refreshCache, resolveKeyInput } from './engine';
import { cache, state } from './state';
import { Validator } from '../engine/Validators';
import { getDebugLevel, setDebugLevel } from '../infra/Debug';
import { bindRuntimeFromSource } from '../infra/runtime';
import { normalizeSource } from '../sources/normalizeSource';

import type { DebugLevel } from '../infra/Debug';
import type { EnvKeyInput, FileApiMode, Source } from '../types';

/** @internal */
export abstract class EnvapterBase {
    /**
     * Enable or disable strict mode. Default `false`. Setting refreshes the cache so
     * previously-cached converted values get re-evaluated under the new rule.
     */
    static set strict(value: boolean) {
        state.strict = value;
        refreshCache();
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
        if (!previous && value && cache.size > 0) mirrorToProcessEnv();
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

    /**
     * Eagerly load the `.env` cascade now instead of lazily on the first read. Idempotent: a no-op
     * once the cache is built. Useful before mirroring to `process.env` (see {@link syncProcessEnv}),
     * which is what the `envapt/config` side-effect entry does.
     */
    static load(): void {
        ensureLoaded();
    }

    /**
     * Bind the environment {@link Source}. On Node the entry binds {@link FileSource} for you
     * (a `process.env` snapshot plus the `.env` cascade). On the browser or Workers, pass a
     * `PortableSource` (or any `Source`) before reading. Pass a `(key) => string | undefined` reader for
     * a source that reads one key at a time and cannot list its keys. Clears and rebuilds the cache.
     */
    static useSource(source: Source | ((key: string) => string | undefined)): void {
        const resolved = normalizeSource(source);
        state.source = resolved;
        bindRuntimeFromSource(resolved);
        refreshCache();
    }

    /**
     * Read an environment variable as its raw string, skipping parsing and conversion.
     */
    getRaw(key: EnvKeyInput): string | undefined {
        return resolveKeyInput(key).value;
    }
}
