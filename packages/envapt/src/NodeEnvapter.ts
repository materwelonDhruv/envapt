import { EnvapterBase } from './core/EnvapterBase';
import { EnvironmentMethods } from './core/EnvironmentMethods';
import { Envapter } from './Envapter';
import { Validator } from './Validators';

import type { EnvFileOptions } from './Dotenv';
import type { ProfilesConfig } from './types';

/**
 * The Node/Bun/Deno facade: {@link Envapter} plus the filesystem-only configuration APIs (`.env`
 * path selection, base directory, dotenv options, and per-environment profiles). The browser and
 * Workers builds export the base {@link Envapter} without these, so calling one where there is no
 * filesystem is a compile error (and a thrown {@link EnvaptError} when types are bypassed).
 *
 * Writes target the state-owning class (`EnvapterBase`/`EnvironmentMethods`), not `this`: the engine
 * reads that state through `EnvapterBase`-anchored paths, so a subclass own-property would be invisible.
 * @public
 */
export class NodeEnvapter extends Envapter {
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

    static get baseDir(): string | undefined {
        return EnvapterBase._baseDir;
    }

    static set envFileOptions(config: EnvFileOptions) {
        Validator.validateEnvFileOptions(config);
        EnvapterBase._userDefinedEnvFileOptions = config;
        this.refreshCache();
    }

    /**
     * Get current dotenv configuration options
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
        // `_environment*` is written by determineEnvironment via `this`, so clear it via `this` too,
        // not via EnvironmentMethods (whose slot a subclass own-property would shadow). The refresh
        // then re-determines the environment from the source on the next read.
        this._environmentExplicitlySet = false;
        this._environment = undefined;
        this.refreshCache();
    }
}
