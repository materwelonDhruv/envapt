/**
 * Environment types supported by Envapter
 *
 * The following keys are checked in order until the first with a non-empty value is found, or defaulting to development if none are set:
 * - `ENVIRONMENT`
 * - `ENV`
 * - `NODE_ENV`
 * - `MODE`
 *
 * @public
 * @see {@link https://envapt.materwelon.dev/docs/environment#detecting-the-environment}
 */
export enum Environment {
    /** The default when no environment variable names a known environment. */
    Development,
    /** Selected when an environment variable reads `staging`. */
    Staging,
    /** Selected when an environment variable reads `production`. */
    Production,
    /** Selected when an environment variable reads `test`. */
    Test
}

// highest precedence first
export const ENV_KEYS = ['ENVIRONMENT', 'ENV', 'NODE_ENV', 'MODE'] as const;

export function parseEnvironment(raw: string): Environment | undefined {
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

export function firstEnvKeyValue(read: (key: string) => string | undefined): string | undefined {
    for (const key of ENV_KEYS) {
        const value = read(key);
        if (value !== undefined && value.length > 0) return value;
    }
    return undefined;
}
