import { Envapter } from './Envapter';
import { Validator } from './Validators';
import { refreshCache } from '../core/engine';
import { assertFileApiSupported, resolveAgainstBase, sourceFileExists } from '../core/paths';
import { state } from '../core/state';

import type { EnvFileOptions } from '../infra/Dotenv';
import type { ProfilesConfig } from '../types';

/**
 * Reads typed environment variables on Node, Bun, and Deno. It adds the filesystem-only configuration
 * APIs: `.env` path selection, base directory, dotenv options, and per-environment profiles. On the
 * portable build (Workers, the browser, edge) these same APIs warn once and do nothing, unless
 * `Envapter.fileApiMode` is `'throw'`.
 * @public
 */
export class NodeEnvapter extends Envapter {
    /**
     * Set custom .env file paths. Setting new paths clears the cache and reloads environment
     * variables. Throws `EnvFilesNotFound` when a path does not exist.
     *
     * Once set, these paths replace the dotenv-flow auto-cascade and any `Envapter.configureProfiles`
     * paths.
     * @see {@link https://envapt.materwelon.dev/docs/env-files#choosing-the-files-yourself}
     */
    static set envPaths(paths: string[] | string) {
        assertFileApiSupported('envPaths', state.source);
        const newPaths = Array.isArray(paths) ? paths : [paths];
        Validator.validateEnvFilesExist(
            newPaths.map((p) => resolveAgainstBase(p)),
            (p) => sourceFileExists(p)
        );

        state.envPaths = newPaths;
        state.envPathsExplicitlySet = true;
        refreshCache();
    }

    /**
     * The configured .env file paths.
     * @see {@link https://envapt.materwelon.dev/docs/env-files#choosing-the-files-yourself}
     */
    static get envPaths(): string[] {
        return state.envPaths;
    }

    /**
     * Set the base directory that relative `.env` paths resolve against. Without one they resolve against
     * `process.cwd()`. It covers the auto-cascade, `Envapter.configureProfiles` paths, and relative `envPaths`.
     * Absolute paths always bypass it. Pass a directory path (`import.meta.dirname`) or a module URL
     * (`import.meta.url`) to resolve paths next to the calling file regardless of launch directory.
     *
     * Set this before `envPaths` so relative `envPaths` validate against the right directory.
     * Setting `undefined` restores `process.cwd()` resolution.
     * @see {@link https://envapt.materwelon.dev/docs/env-files#reading-from-a-fixed-directory}
     */
    static set baseDir(value: string | URL | undefined) {
        const source = state.source;
        assertFileApiSupported('baseDir', source);
        state.baseDir = value === undefined ? undefined : source.normalizeBaseDir(value);
        refreshCache();
    }

    /**
     * The configured base directory, or `undefined` when relative paths resolve against the working directory.
     * @see {@link https://envapt.materwelon.dev/docs/env-files#reading-from-a-fixed-directory}
     */
    static get baseDir(): string | undefined {
        return state.baseDir;
    }

    /**
     * Set the env file loader options (`encoding`, `override`). Refreshes the cache. Any other key
     * throws `InvalidUserDefinedConfig`.
     * @see {@link https://envapt.materwelon.dev/docs/env-files#file-options}
     */
    static set envFileOptions(config: EnvFileOptions) {
        Validator.validateEnvFileOptions(config);
        state.userDefinedEnvFileOptions = config;
        refreshCache();
    }

    /**
     * The env file loader options.
     * @see {@link https://envapt.materwelon.dev/docs/env-files#file-options}
     */
    static get envFileOptions(): EnvFileOptions {
        return state.userDefinedEnvFileOptions;
    }

    /**
     * Configure per-environment `.env` path overrides on top of the dotenv-flow auto-cascade.
     *
     * When set, each `Environment` key's `paths` load ahead of the cascade for that environment and
     * win over it, unless `envFileOptions.override` is `true`. Unspecified environments still use the
     * cascade as-is.
     * Set `useDefaults: false` to disable the cascade entirely (load only the configured paths).
     *
     * Setting an explicit `Envapter.envPaths` value at any point overrides this configuration.
     *
     * @example
     * ```ts
     * Envapter.configureProfiles({
     *   staging: { paths: 'config/staging.env' },
     *   production: { paths: ['config/prod.env', 'secrets/prod.env'] }
     * });
     * ```
     * @see {@link https://envapt.materwelon.dev/docs/env-files#profiles}
     */
    static configureProfiles(config: ProfilesConfig): void {
        assertFileApiSupported('configureProfiles', state.source);
        state.profiles = config;
        refreshCache();
    }

    /**
     * Clears any `Envapter.configureProfiles` call, any explicit `Envapter.envPaths` assignment, and any
     * environment set through `Envapter.environment`. `Envapter.baseDir` keeps its value. The call
     * reloads the dotenv-flow cascade right away, choosing the files from the environment set in your
     * env vars.
     * @see {@link https://envapt.materwelon.dev/docs/env-files#profiles}
     */
    static resetPaths(): void {
        state.profiles = undefined;
        state.envPaths = ['.env'];
        state.envPathsExplicitlySet = false;
        state.environmentExplicitlySet = false;
        state.environment = undefined;
        refreshCache();
    }
}
