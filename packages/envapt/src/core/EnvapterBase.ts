import { mirrorToProcessEnv, refreshCache, resolveKeyInput } from './engine';
import { cache, state } from './state';
import { Validator } from '../engine/Validators';
import { getDebugLevel, setDebugLevel } from '../infra/Debug';
import { bindRuntimeFromSource } from '../infra/runtime';
import { normalizeSource } from '../sources/normalizeSource';

import type { DebugLevel } from '../infra/Debug';
import type { EnvKeyInput, FileApiMode, Source } from '../types';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- the reader chain and user config classes extend it
export abstract class EnvapterBase {
    /**
     * When `true`, a whitespace-only value counts as missing, a `${VAR}` that can't resolve throws
     * `MissingEnvValue`, and an empty array element throws `EmptyArrayElement`. Default `false`.
     * Setting it clears and rebuilds the cache.
     * @see {@link https://envapt.materwelon.dev/docs/required-values#strict-mode}
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
     * @see {@link https://envapt.materwelon.dev/docs/errors#debug-logging}
     */
    static set debug(level: DebugLevel) {
        setDebugLevel(level);
    }

    static get debug(): DebugLevel {
        return getDebugLevel();
    }

    /**
     * When `true`, copies dotenv-loaded keys into `process.env`. Default `false`.
     *
     * `envFileOptions.override` controls collisions because only keys the loader wrote are copied.
     * With the default `false`, existing `process.env` values stay. With `true`, the file value
     * replaces them in both the cache and `process.env`.
     *
     * Flipping `false → true` copies the loaded keys immediately without a cache refresh.
     * Flipping `true → false` leaves copied keys in `process.env` until the process exits.
     * @see {@link https://envapt.materwelon.dev/docs/env-files#file-options}
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
     * `envFileOptions`, `configureProfiles`, `resetPaths`). `'warn'` (the default) warns once and
     * does nothing. `'throw'` throws {@link EnvaptError} `FileApiUnsupported`. The node build runs these
     * APIs normally and this value has no effect there.
     * @see {@link https://envapt.materwelon.dev/docs/compatibility#file-apis-and-fileapimode}
     */
    static set fileApiMode(mode: FileApiMode) {
        Validator.validateFileApiMode(mode);
        state.fileApiMode = mode;
    }

    static get fileApiMode(): FileApiMode {
        return state.fileApiMode;
    }

    /**
     * Bind the environment {@link Source}. On Node the entry binds {@link FileSource} for you
     * (a `process.env` snapshot plus the `.env` cascade). On the browser or Workers, pass a
     * `PortableSource` (or any `Source`) before reading. Pass a `(key) => string | undefined` reader for
     * a source that reads one key at a time and cannot list its keys. Clears and rebuilds the cache.
     * @see {@link https://envapt.materwelon.dev/docs/sources#the-sources-envapt-ships}
     */
    static useSource(source: Source | ((key: string) => string | undefined)): void {
        const resolved = normalizeSource(source);
        state.source = resolved;
        bindRuntimeFromSource(resolved);
        refreshCache();
    }

    /**
     * The currently bound {@link Source}. Use it with `merge` to add another source without
     * replacing the existing one. On portable builds, bind a source before composing it.
     * @see {@link https://envapt.materwelon.dev/docs/sources#combining-sources}
     */
    static get source(): Source {
        return state.source;
    }

    /**
     * Read an environment variable as its raw string, skipping parsing and conversion. A `${NAME}`
     * reference in the value comes back unexpanded.
     * @see {@link https://envapt.materwelon.dev/docs/envapter#the-raw-string}
     */
    static getRaw(key: EnvKeyInput): string | undefined {
        return resolveKeyInput(key).value;
    }
}
