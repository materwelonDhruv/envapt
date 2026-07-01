// a source with no filesystem. supportsFiles is the discriminator, absent or false here.
interface BareSource {
    readVars(): Record<string, string>;
    readonly supportsFiles?: false;
}

// a filesystem-backed source. supportsFiles true unlocks the .env cascade and baseDir. FileSource implements it.
interface FileCapableSource {
    readVars(): Record<string, string>;
    readonly supportsFiles: true;
    readFile(path: string, encoding: string): string | undefined;
    resolvePath(baseDir: string, candidate: string): string;
    normalizeBaseDir(value: string | URL): string;
    writeVars(vars: Record<string, string>): void;
}

/**
 * A pluggable source of environment variables. The default {@link FileSource} reads `process.env` plus
 * the `.env` cascade. A {@link PortableSource} lets the same engine run where there is no ambient
 * environment (an injected object on the browser, the Cloudflare `env` binding on Workers). Bind one
 * with `Envapter.useSource`.
 * @public
 */
type Source = BareSource | FileCapableSource;

export type { Source, BareSource, FileCapableSource };
