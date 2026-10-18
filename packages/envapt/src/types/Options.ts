import type { Environment } from '../core/Environment';

/**
 * Per-environment profile entry passed to `Envapter.configureProfiles`.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/env-files#profiles}
 */
interface EnvProfile {
    /**
     * One or more `.env` paths to load for this environment. Earlier paths take precedence unless
     * `envFileOptions.override` is `true`.
     */
    paths: string | string[];
}

/**
 * Configuration object for `Envapter.configureProfiles`. Maps each `Environment` to an optional
 * profile override. Unspecified environments use the default cascade (`.env.${env}.local`,
 * `.env.${env}`, `.env.local`, `.env`).
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/env-files#profiles}
 */
type ProfilesConfig = Partial<Record<Environment, EnvProfile>> & {
    /**
     * Set `false` to load only the configured paths. Defaults to `true`, where the configured paths
     * load ahead of the dotenv-flow cascade.
     */
    useDefaults?: boolean;
};

/**
 * How the portable build's filesystem-only config APIs behave when called. `'warn'` (the default)
 * warns once and no-ops. `'throw'` throws `FileApiUnsupported`. The node build runs these APIs
 * normally and is unaffected by this value.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/compatibility#binding-by-runtime}
 */
type FileApiMode = 'warn' | 'throw';

export type { EnvProfile, ProfilesConfig, FileApiMode };
