import type { Environment } from '../core/Environment';

/**
 * Per-environment profile entry passed to `Envapter.configureProfiles`.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/environment#custom-profiles}
 */
interface EnvProfile {
    /** One or more `.env` paths to load for this environment. Earlier paths take precedence. */
    paths: string | string[];
}

/**
 * Configuration object for `Envapter.configureProfiles`. Maps each `Environment` to an optional
 * profile override. Unspecified environments fall through to the default cascade behavior
 * (`.env.${env}.local`, `.env.${env}`, `.env.local`, `.env`).
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/environment#custom-profiles}
 */
type ProfilesConfig = Partial<Record<Environment, EnvProfile>> & {
    /**
     * When `false`, disables the default dotenv-flow cascade entirely. Only the explicitly
     * configured paths are loaded. Defaults to `true` (the cascade still runs and configured
     * paths take higher precedence).
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
