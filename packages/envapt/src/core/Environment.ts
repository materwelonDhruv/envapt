import { isMissing } from './missing';

/**
 * Environment types supported by Envapter
 *
 * The following keys are checked in order until the first with a present (non-missing) value, defaulting to development if none are set:
 * - `ENVIRONMENT`
 * - `ENV`
 * - `NODE_ENV`
 * - `MODE`
 *
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/environment#detecting-the-environment}
 */
export const Environment = {
    /** The default when no environment variable holds a known environment. */
    Development: 'development',
    /** Selected when an environment variable reads `staging`. */
    Staging: 'staging',
    /** Selected when an environment variable reads `production`. */
    Production: 'production',
    /** Selected when an environment variable reads `test`. */
    Test: 'test'
} as const;

/**
 * One of the {@link Environment} values: `'development'`, `'staging'`, `'production'`, or `'test'`.
 * @public
 */
export type Environment = (typeof Environment)[keyof typeof Environment];

const ENVIRONMENTS: readonly string[] = Object.values(Environment);

// highest precedence first
export const ENV_KEYS = ['ENVIRONMENT', 'ENV', 'NODE_ENV', 'MODE'] as const;

function isEnvironment(name: string): name is Environment {
    return ENVIRONMENTS.includes(name);
}

export function parseEnvironment(raw: string): Environment | undefined {
    const name = raw.toLowerCase();
    return isEnvironment(name) ? name : undefined;
}

export function firstEnvKeyValue(read: (key: string) => string | undefined): string | undefined {
    for (const key of ENV_KEYS) {
        const value = read(key);
        if (!isMissing(value)) return value;
    }
    return undefined;
}
