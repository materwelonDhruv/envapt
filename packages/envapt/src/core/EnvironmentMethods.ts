import { debugWarn } from '../Debug';
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
    Production,
    Test
}

// Keys carrying the environment name, highest precedence first. Checked in order until the first with a non-empty value is found, or defaulting to development if none are set.
const ENV_KEYS = ['ENVIRONMENT', 'ENV', 'NODE_ENV', 'MODE'] as const;

function parseEnvironment(raw: string): Environment | undefined {
    switch (raw.toLowerCase()) {
        case 'production':
            return Environment.Production;
        case 'staging':
            return Environment.Staging;
        case 'test':
            return Environment.Test;
        case 'development':
            return Environment.Development;
        default:
            return undefined;
    }
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
        if (typeof env === 'number') {
            this._environment = env;
            this._environmentExplicitlySet = true;
            return;
        }
        if (typeof env === 'string') {
            this._environment = parseEnvironment(env) ?? Environment.Development;
            this._environmentExplicitlySet = true;
            return;
        }

        const raw = this.firstEnvKeyValue((key) => {
            const value = this.config.get(key);
            return typeof value === 'string' ? value : undefined;
        });
        if (raw === undefined) {
            debugWarn(`no environment set (looked for ${ENV_KEYS.join(', ')}); defaulting to development`);
            this._environment = Environment.Development;
            return;
        }
        const parsed = parseEnvironment(raw);
        if (parsed === undefined) {
            debugWarn(`unrecognized environment "${raw}"; defaulting to development`);
            this._environment = Environment.Development;
            return;
        }
        this._environment = parsed;
    }

    private static firstEnvKeyValue(read: (key: string) => string | undefined): string | undefined {
        for (const key of ENV_KEYS) {
            const value = read(key);
            if (value !== undefined && value.length > 0) return value;
        }
        return undefined;
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

    /**
     * Check if the current environment is test
     */
    static get isTest(): boolean {
        return this.environment === Environment.Test;
    }

    /**
     * @see {@link EnvironmentMethods.isTest}
     */
    get isTest(): boolean {
        return EnvironmentMethods.environment === Environment.Test;
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
     * Reads the source's raw vars (not `this.config`, which would recurse: cascade selection runs
     * before the `.env` load). `Envapter.environment` may differ post-load if a file sets `ENVIRONMENT`.
     * @internal
     */
    protected static getCascadeEnvironment(): Environment {
        if (this._environment !== undefined) return this._environment;

        const vars = EnvapterBase._source.readVars();
        const raw = this.firstEnvKeyValue((key) => vars[key]);
        return raw === undefined ? Environment.Development : (parseEnvironment(raw) ?? Environment.Development);
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
     * `Envapter.configureProfiles` overrides on top of `_envPaths` when the user has NOT
     * explicitly set `envPaths`.
     *
     * Precedence (passed to dotenv with first-wins semantics):
     *   1. profile-configured paths for the current env (if any)
     *   2. `.env.${env}.local`
     *   3. `.env.${env}`
     *   4. `.env.local`
     *   5. `.env`
     *
     * If `useDefaults: false` is set on the profiles config, only (1) is loaded, no cascade.
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
