import type { EnvaptConverter } from './Conversion';
import type { Environment } from '../core/EnvironmentMethods';

/**
 * Options for the \@Envapt decorator (modern API). `required: true` is mutually exclusive
 * with `fallback`; see the per-converter overloads in `Envapt.ts` for the type-level mutex.
 * @public
 */
interface EnvaptOptions<TFallback = string> {
    fallback?: TFallback;
    converter?: EnvaptConverter<TFallback>;
    required?: boolean;
}

/**
 * Per-environment profile entry passed to `Envapter.configureProfiles`.
 * @public
 */
interface EnvProfile {
    /** One or more `.env` paths to load for this environment. Order matters: earlier paths take precedence. */
    paths: string | string[];
}

/**
 * Configuration object for `Envapter.configureProfiles`. Maps each `Environment` to an optional
 * profile override. Unspecified environments fall through to the default cascade behavior
 * (`.env.${env}.local`, `.env.local`, `.env.${env}`, `.env`).
 * @public
 */
type ProfilesConfig = Partial<Record<Environment, EnvProfile>> & {
    /**
     * When `false`, disables the default dotenv-flow cascade entirely. Only the explicitly
     * configured paths are loaded. Defaults to `true` (cascade still runs, configured paths
     * are layered on top with higher precedence).
     */
    useDefaults?: boolean;
};

export type { EnvaptOptions, EnvProfile, ProfilesConfig };
