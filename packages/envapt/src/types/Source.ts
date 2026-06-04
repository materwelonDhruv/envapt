/**
 * A pluggable source of environment variables. The default {@link NodeEnvSource} reads
 * `process.env` plus the `.env` cascade; alternative sources let the same engine run where
 * there is no ambient environment (an injected object on the browser, the Cloudflare `env`
 * binding on Workers). Bind one with `Envapter.useSource`.
 * @public
 */
interface EnvSource {
    /** Return every variable this source provides, as plain strings. */
    readVars(): Record<string, string>;
    /**
     * Whether this source can load `.env` files from a filesystem. When falsy, the `.env`
     * cascade, profiles, and `envPaths` are skipped. Defaults to `false`.
     */
    readonly supportsFiles?: boolean;
}

export type { EnvSource };
