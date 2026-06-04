/**
 * A source with no filesystem: an injected object on the browser, or the Cloudflare `env` binding on
 * Workers. The `.env` cascade, profiles, and the `envPaths`/`baseDir`/`configureProfiles` APIs do not
 * apply; only `readVars()` populates the cache.
 * @public
 */
interface BareEnvSource {
    /** Return every variable this source provides, as plain strings. */
    readVars(): Record<string, string>;
    /** Leave unset (or `false`); a bare source has no filesystem. */
    readonly supportsFiles?: false;
}

/**
 * A filesystem-backed source, like the default {@link NodeEnvSource}. Setting `supportsFiles` to
 * `true` requires all four file capabilities, so the engine can load the `.env` cascade, resolve
 * `baseDir`, and mirror loaded keys back to the ambient environment.
 * @public
 */
interface FileEnvSource {
    /** Return every variable this source provides, as plain strings. */
    readVars(): Record<string, string>;
    /** When `true`, the engine loads the `.env` cascade, profiles, and `envPaths` through the methods below. */
    readonly supportsFiles: true;
    /** Read a file's text, or `undefined` when it is absent or unreadable. Backs the loader and existence checks. */
    readFile(path: string, encoding: string): string | undefined;
    /** Join a relative `.env` path onto `baseDir`; absolute paths are returned unchanged. */
    resolvePath(baseDir: string, candidate: string): string;
    /** Normalize a `baseDir` value (a directory path, or a module / `file:` URL) to an absolute directory path. */
    normalizeBaseDir(value: string | URL): string;
    /** Mirror loaded keys back to the ambient environment (e.g. `process.env`); backs `Envapter.syncProcessEnv`. */
    writeVars(vars: Record<string, string>): void;
}

/**
 * A pluggable source of environment variables. The default {@link NodeEnvSource} (a
 * {@link FileEnvSource}) reads `process.env` plus the `.env` cascade; a {@link BareEnvSource} lets the
 * same engine run where there is no ambient environment (an injected object on the browser, the
 * Cloudflare `env` binding on Workers). Bind one with `Envapter.useSource`.
 * @public
 */
type EnvSource = BareEnvSource | FileEnvSource;

export type { EnvSource, BareEnvSource, FileEnvSource };
