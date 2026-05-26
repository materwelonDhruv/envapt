import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';

import { Envapter, Environment } from '../src';

describe('profile loading', () => {
    const envDirectory = resolve(import.meta.dirname, 'environment');

    const profiles: Record<Environment, { path: string; name: string; port: number; apiUrl: string; flag: boolean }> = {
        [Environment.Development]: {
            path: resolve(envDirectory, '.env.development'),
            name: 'dev-profile',
            port: 3001,
            apiUrl: 'https://dev.api.envapt.local',
            flag: true
        },
        [Environment.Staging]: {
            path: resolve(envDirectory, '.env.staging'),
            name: 'staging-profile',
            port: 4004,
            apiUrl: 'https://staging.api.envapt.local',
            flag: false
        },
        [Environment.Production]: {
            path: resolve(envDirectory, '.env.production'),
            name: 'production-profile',
            port: 443,
            apiUrl: 'https://api.envapt.com',
            flag: false
        }
    };

    const fallbackEnvPath = profiles[Environment.Development].path;
    const defaultEnvPaths = Envapter.envPaths
        .map((path) => resolve(process.cwd(), path))
        .filter((path) => existsSync(path));
    const defaultEnvironment = Envapter.environment;

    afterEach(() => {
        const restorePaths = defaultEnvPaths.length > 0 ? defaultEnvPaths : [fallbackEnvPath];
        try {
            Envapter.envPaths = restorePaths;
        } catch {
            Envapter.envPaths = fallbackEnvPath;
        }
        Envapter.environment = defaultEnvironment;
    });

    const pickProfilePath = (): string => {
        const environment = Envapter.environment;
        if (environment === Environment.Production) return profiles[Environment.Production].path;
        if (environment === Environment.Staging) return profiles[Environment.Staging].path;
        return profiles[Environment.Development].path;
    };

    const describeEnv = (env: Environment): string => {
        switch (env) {
            case Environment.Production:
                return 'production';
            case Environment.Staging:
                return 'staging';
            default:
                return 'development';
        }
    };

    ([Environment.Development, Environment.Staging, Environment.Production] as const).forEach((env) => {
        const expected = profiles[env];

        it(`loads ${describeEnv(env)} profile when environment is ${describeEnv(env)}`, () => {
            Envapter.environment = env;

            const selectedProfilePath = pickProfilePath();
            Envapter.envPaths = selectedProfilePath;

            expect(Envapter.environment).to.equal(env);
            expect(Envapter.get('PROFILE_NAME')).to.equal(expected.name);
            expect(Envapter.getNumber('PROFILE_PORT')).to.equal(expected.port);
            expect(Envapter.get('PROFILE_API_URL')).to.equal(expected.apiUrl);
            expect(Envapter.getBoolean('PROFILE_EXPERIMENTAL_FLAG')).to.equal(expected.flag);
        });
    });
});
