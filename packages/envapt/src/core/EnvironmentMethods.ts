import process from 'node:process';

import { EnvaptError, EnvaptErrorCodes } from '../Error';
import { EnvapterBase } from './EnvapterBase';

import type { EnvProfile, ProfilesConfig } from '../types';

/**
 * Environment types supported by Envapter
 * @public
 */
export enum Environment {
    Development,
    Staging,
    Production
}

/**
 * Mixin for environment detection and checking methods
 * @internal
 */
export class EnvironmentMethods extends EnvapterBase {
    protected static _environment: Environment | undefined;
    protected static _environmentExplicitlySet = false;
    protected static _profiles: ProfilesConfig | undefined;

    protected static determineEnvironment(env?: string | Environment): void {
        const environment =
            env ??
            this.getRawValue('ENVIRONMENT', this.getRawValue('ENV', this.getRawValue('NODE_ENV', 'development')));

        if (typeof environment === 'string') {
            this._environment =
                environment.toLowerCase() === 'production'
                    ? Environment.Production
                    : environment === 'staging'
                      ? Environment.Staging
                      : Environment.Development;
        } else {
            this._environment = environment;
        }
        if (env !== undefined) this._environmentExplicitlySet = true;
    }

    private static getRawValue(key: string, fallback: string): string {
        return (this.config.get(key) as string) || fallback;
    }

    /**
     * Get the current application environment
     */
    static get environment(): Environment {
        if (this._environment === undefined) {
            this.determineEnvironment();
        }
        return this._environment as Environment;
    }

    /**
     * Set the application environment. Accepts either Environment enum or string value.
     */
    static set environment(env: string | Environment) {
        this.determineEnvironment(env);
    }

    /**
     * @see {@link EnvironmentMethods.environment}
     */
    get environment(): Environment {
        return EnvironmentMethods.environment;
    }

    /**
     * @see {@link EnvironmentMethods.environment}
     */
    set environment(env: string | Environment) {
        EnvironmentMethods.determineEnvironment(env);
    }

    /**
     * Check if the current environment is production
     */
    static get isProduction(): boolean {
        return this.environment === Environment.Production;
    }

    /**
     * @see {@link EnvironmentMethods.isProduction}
     */
    get isProduction(): boolean {
        return EnvironmentMethods.environment === Environment.Production;
    }

    /**
     * Check if the current environment is staging
     */
    static get isStaging(): boolean {
        return this.environment === Environment.Staging;
    }

    /**
     * @see {@link EnvironmentMethods.isStaging}
     */
    get isStaging(): boolean {
        return EnvironmentMethods.environment === Environment.Staging;
    }

    /**
     * Check if the current environment is development
     */
    static get isDevelopment(): boolean {
        return this.environment === Environment.Development;
    }

    /**
     * @see {@link EnvironmentMethods.isDevelopment}
     */
    get isDevelopment(): boolean {
        return EnvironmentMethods.environment === Environment.Development;
    }

    protected static override refreshCache(): void {
        // If the env was inferred (not user-set), reset it so re-hydration re-determines
        // from current state. If the user explicitly set Envapter.environment = X, preserve
        // that value through the refresh. The immediate re-hydration inside super.refreshCache()
        // will use it for cascade selection.
        if (!this._environmentExplicitlySet) this._environment = undefined;
        super.refreshCache();
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
        this._profiles = config;
        this.refreshCache();
    }

    /**
     * Reset all path-resolution configuration to defaults: clears any prior
     * {@link configureProfiles} call AND any explicit `Envapter.envPaths` assignment.
     * Returns the resolver to the pure dotenv-flow cascade.
     */
    static resetProfiles(): void {
        this._profiles = undefined;
        this._envPaths = ['.env'];
        this._envPathsExplicitlySet = false;
        // Also clear the explicit-env flag so the next refresh re-determines env from
        // process.env / loaded files. resetProfiles is a "back to defaults" call.
        // Any user-set environment is wiped along with paths and profiles.
        this._environmentExplicitlySet = false;
        this._environment = undefined;
        this.refreshCache();
    }

    /**
     * Determine the current environment for cascade-file selection by reading `process.env`
     * directly. Bypassing `this.config` to avoid a circular dependency (cascade selection
     * happens before `.env` files are loaded). The post-load `Envapter.environment` value
     * may differ if a loaded `.env` file declares its own `ENVIRONMENT`/`ENV`/`NODE_ENV`.
     * @internal
     */
    protected static getCascadeEnvironment(): Environment {
        if (this._environment !== undefined) return this._environment;

        const raw = process.env.ENVIRONMENT ?? process.env.ENV ?? process.env.NODE_ENV ?? 'development';
        const lower = raw.toLowerCase();
        if (lower === 'production') return Environment.Production;
        if (lower === 'staging') return Environment.Staging;
        return Environment.Development;
    }

    /**
     * Build the dotenv-flow cascade for a given environment, in dotenv first-wins precedence
     * order (highest precedence first). Missing files are silently filtered.
     *
     * Precedence is **most-specific-wins** (matches Vite / Astro / Vocs):
     *   `.env.${env}.local` \> `.env.${env}` \> `.env.local` \> `.env`
     *
     * This differs from dotenv-flow / Next.js convention which puts `.env.local` above
     * `.env.${env}`. We chose the most-specific-wins order so committed env-specific files
     * (`.env.production`) are authoritative for that environment regardless of whether a
     * stray `.env.local` is present.
     * @internal
     */
    protected static buildCascadePaths(env: Environment): string[] {
        const envName = Environment[env].toLowerCase();
        return [`.env.${envName}.local`, `.env.${envName}`, '.env.local', '.env']
            .map((name) => this.resolveAgainstBase(name))
            .filter((p) => this.sourceFileExists(p));
    }

    private static normalizeProfilePaths(profile: EnvProfile | undefined): string[] {
        if (!profile) return [];
        return Array.isArray(profile.paths) ? profile.paths : [profile.paths];
    }

    /**
     * Override the base implementation to layer the dotenv-flow cascade + any
     * {@link configureProfiles} overrides on top of `_envPaths` when the user has NOT
     * explicitly set `envPaths`.
     *
     * Precedence (passed to dotenv with first-wins semantics):
     *   1. profile-configured paths for the current env (if any)
     *   2. `.env.${env}.local`
     *   3. `.env.${env}`
     *   4. `.env.local`
     *   5. `.env`
     *
     * If `useDefaults: false` is set on the profiles config, only (1) is loaded — no cascade.
     * If `envPaths` was explicitly set, only `envPaths` is loaded (everything else ignored).
     * @internal
     */
    protected static override resolveEffectivePaths(): string[] {
        if (this._envPathsExplicitlySet) return this._envPaths.map((p) => this.resolveAgainstBase(p));

        const env = this.getCascadeEnvironment();
        const profileEntry = this._profiles?.[env];
        const profilePaths = this.normalizeProfilePaths(profileEntry);

        // Validate that explicitly configured profile paths exist for the active env.
        if (profilePaths.length > 0) {
            const missing = profilePaths.filter((p) => !this.sourceFileExists(this.resolveAgainstBase(p)));
            if (missing.length > 0) {
                throw new EnvaptError(
                    EnvaptErrorCodes.EnvFilesNotFound,
                    `Environment file not found at path: ${missing.join(', ')}`
                );
            }
        }

        const cascade = this._profiles?.useDefaults === false ? [] : this.buildCascadePaths(env);
        return [...profilePaths.map((p) => this.resolveAgainstBase(p)), ...cascade];
    }
}
