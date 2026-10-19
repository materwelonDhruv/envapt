import { isMissing } from './missing';

/**
 * The environment names envapt detects. The first of {@link ENVIRONMENT_KEYS} with a value sets the
 * environment, matched case-insensitively. A missing or unknown name selects `'development'`.
 *
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/environment#detecting-the-environment}
 */
export const Environment = {
    /** The default when no environment variable is set, or when the first one set holds an unknown name. */
    Development: 'development',
    /** Selected by the value `staging`. */
    Staging: 'staging',
    /** Selected by the value `production`. */
    Production: 'production',
    /** Selected by the value `test`. */
    Test: 'test'
} as const;

/**
 * One of the {@link Environment} values: `'development'`, `'staging'`, `'production'`, or `'test'`.
 * @public
 */
export type Environment = (typeof Environment)[keyof typeof Environment];

const ENVIRONMENTS: readonly string[] = Object.values(Environment);

/**
 * The variables envapt reads to detect the {@link Environment}, highest precedence first. The first one
 * with a value sets it.
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/environment#detecting-the-environment}
 */
export const ENVIRONMENT_KEYS = ['ENVIRONMENT', 'ENV', 'NODE_ENV', 'MODE'] as const;

function isEnvironment(name: string): name is Environment {
    return ENVIRONMENTS.includes(name);
}

export function parseEnvironment(raw: string): Environment | undefined {
    const name = raw.toLowerCase();
    return isEnvironment(name) ? name : undefined;
}

export function firstEnvKeyValue(read: (key: string) => string | undefined): string | undefined {
    for (const key of ENVIRONMENT_KEYS) {
        const value = read(key);
        if (!isMissing(value)) return value;
    }
    return undefined;
}
