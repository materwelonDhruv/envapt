import process from 'node:process';

import { Envapter } from './Envapter';
import { Validator } from './Validators';
import { EnvapterBase } from '../core/EnvapterBase';
import { EnvironmentMethods } from '../core/EnvironmentMethods';
import { setRuntimeSink } from '../infra/runtime';
import { NodeEnvSource } from '../sources/NodeEnvSource';

import type { EnvFileOptions } from '../infra/Dotenv';
import type { ProfilesConfig } from '../types';

/**
 * The Node/Bun/Deno facade: {@link Envapter} plus the filesystem-only configuration APIs (`.env`
 * path selection, base directory, dotenv options, and per-environment profiles). On the portable
 * build (Workers, the browser, edge) these same APIs warn once and no-op by default, controlled by
 * `Envapter.fileApiMode`.
 *
 * Writes target the state-owning class (`EnvapterBase`/`EnvironmentMethods`), not `this`: the engine
 * reads that state through `EnvapterBase`-anchored paths, so a subclass own-property would be invisible.
 * @public
 */
export class NodeEnvapter extends Envapter {
    // A static block (not a top-level statement in a separate entry) keeps the bind intrinsic to this
    // class: tree-shaken out of `import { EnvaptError }`, run whenever `Envapter` is referenced, with no
    // sideEffects entry. Depends on the es2022 native static-block emit; lowering the target defeats it.
    static {
        setRuntimeSink((line) => process.stderr.write(`${line}\n`));
        NodeEnvapter.useSource(new NodeEnvSource());
    }

    /**
     * Set custom .env file paths. Accepts either a single path or array of paths.
     * Setting new paths clears the cache and reloads environment variables.
     *
     * When set, this takes absolute precedence. The dotenv-flow auto-cascade and any
     * `Envapter.configureProfiles` configuration are ignored.
     */
    static set envPaths(paths: string[] | string) {
        this.assertFileApiSupported('envPaths', EnvapterBase._source);
        const newPaths = Array.isArray(paths) ? paths : [paths];
        Validator.validateEnvFilesExist(
            newPaths.map((p) => this.resolveAgainstBase(p)),
            (p) => this.sourceFileExists(p)
        );

        EnvapterBase._envPaths = newPaths;
        EnvapterBase._envPathsExplicitlySet = true;
        this.refreshCache();
    }

    /**
     * Get currently configured .env file paths
     */
    static get envPaths(): string[] {
        return EnvapterBase._envPaths;
    }

    /**
     * Set a base directory that relative `.env` paths resolve against instead of
     * `process.cwd()`: the auto-cascade, `Envapter.configureProfiles` paths, and relative
     * `envPaths`. Absolute paths always bypass it. Pass a directory, or a module URL
     * (`import.meta.url`, ESM) / `import.meta.dirname` / `__dirname` (CJS) to anchor
     * resolution next to the calling file regardless of launch directory.
     *
     * Set this before `envPaths` so relative `envPaths` validate against the right directory.
     * Unset (`undefined`) restores `process.cwd()` resolution.
     */
    static set baseDir(value: string | URL | undefined) {
        const source = EnvapterBase._source;
        this.assertFileApiSupported('baseDir', source);
        EnvapterBase._baseDir = value === undefined ? undefined : source.normalizeBaseDir(value);
        this.refreshCache();
    }

    /** The configured base directory, or `undefined` when relative paths resolve against the working directory. */
    static get baseDir(): string | undefined {
        return EnvapterBase._baseDir;
    }

    /** Set the env file loader options (`encoding`, `override`). Refreshes the cache. */
    static set envFileOptions(config: EnvFileOptions) {
        Validator.validateEnvFileOptions(config);
        EnvapterBase._userDefinedEnvFileOptions = config;
        this.refreshCache();
    }

    /**
     * Get current env file loader options
     */
    static get envFileOptions(): EnvFileOptions {
        return EnvapterBase._userDefinedEnvFileOptions;
    }

    /**
     * Configure per-environment `.env` path overrides on top of the dotenv-flow auto-cascade.
     *
     * When set, each `Environment` key's `paths` are loaded at higher precedence than the
     * cascade for that environment. Unspecified environments still use the cascade as-is.
     * Set `useDefaults: false` to disable the cascade entirely (load only the configured paths).
     *
     * Setting an explicit `Envapter.envPaths` value at any point overrides this configuration.
     *
     * @example
     * ```ts
     * Envapter.configureProfiles({
     *   [Environment.Staging]: { paths: 'config/staging.env' },
     *   [Environment.Production]: { paths: ['config/prod.env', 'secrets/prod.env'] }
     * });
     * ```
     */
    static configureProfiles(config: ProfilesConfig): void {
        this.assertFileApiSupported('configureProfiles', EnvapterBase._source);
        EnvironmentMethods._profiles = config;
        this.refreshCache();
    }

    /**
     * Reset all path-resolution configuration to defaults: clears any prior
     * `Envapter.configureProfiles` call AND any explicit `Envapter.envPaths` assignment.
     * Returns the resolver to the pure dotenv-flow cascade.
     */
    static resetProfiles(): void {
        EnvironmentMethods._profiles = undefined;
        EnvapterBase._envPaths = ['.env'];
        EnvapterBase._envPathsExplicitlySet = false;
        // Clear via `this`, not EnvironmentMethods: determineEnvironment writes `_environment*` via
        // `this`, so a base-anchored clear would leave a subclass own-property shadowing it.
        this._environmentExplicitlySet = false;
        this._environment = undefined;
        this.refreshCache();
    }
}
