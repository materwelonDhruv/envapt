import {
    Converters,
    ENVIRONMENT_KEYS,
    Envapter,
    EnvaptError,
    EnvaptErrorCodes,
    Environment,
    FileSource,
    merge,
    PortableSource
} from 'envapt';

import { levelSchema, poolSchema } from './schemas.mjs';

import type {
    ConverterFunction,
    DebugLevel,
    EnvFileOptions,
    EnvProfile,
    FileApiMode,
    JsonValue,
    ProfilesConfig,
    Source,
    StandardSchemaV1,
    TimeFallback
} from 'envapt';

export const host: string = Envapter.get('HOST', 'localhost');
export const maybeHost: string | undefined = Envapter.get(['HOST', 'LEGACY_HOST']);
export const port: number = Envapter.getAs('PORT', Converters.Port, 3000);
export const maybePort: number | undefined = Envapter.getAs('PORT', Converters.Port);
export const ttl: number = Envapter.getAs('CACHE_TTL', Converters.Time, '5m');
export const ttlMs: number = Envapter.getAs('CACHE_TTL', Converters.Time, 300_000);
export const debug: boolean = Envapter.getAs('DEBUG', Converters.Boolean, false);
export const snowflake: bigint = Envapter.getAs('GUILD_ID', Converters.BigInt, BigInt(0));
export const apiUrl: URL | undefined = Envapter.getAs('API_URL', Converters.Url);
export const releasedAt: Date = Envapter.getAs('RELEASED_AT', Converters.Date, new Date(0));
export const pattern: RegExp = Envapter.getAs('ALLOWED', Converters.RegExp, /x/);
export const email: string = Envapter.getAs('ADMIN_EMAIL', Converters.Email, 'ops@example.com');
export const tags: string[] = Envapter.getAs('TAGS', Converters.array(), []);
export const ports: number[] = Envapter.getAs('PORTS', Converters.array({ of: Converters.Port }), [80]);
export const durations: number[] = Envapter.getAs('TTLS', Converters.array({ of: Converters.Time }), ['5m']);
export const json: JsonValue | undefined = Envapter.getAs('META', Converters.Json);

interface FeatureFlags {
    beta: boolean;
}
export const flags: FeatureFlags = Envapter.getAs<FeatureFlags>('FLAGS', Converters.Json, { beta: false });

const splitHosts: ConverterFunction<string[]> = (raw) => raw.split(',');
export const hosts: string[] = Envapter.getAs('HOSTS', splitHosts, ['localhost']);
export const poolSize: number | undefined = Envapter.getAs('POOL_SIZE', poolSchema);
export const poolSizeOr: number = Envapter.getAs('POOL_SIZE', poolSchema, 10);

const upper: StandardSchemaV1<string, string> = {
    '~standard': {
        version: 1,
        vendor: 'consumer',
        validate: (value) =>
            typeof value === 'string' ? { value: value.toUpperCase() } : { issues: [{ message: 'x' }] }
    }
};
export const region: string | undefined = Envapter.getAs('REGION', upper);

export const databaseUrl: URL = Envapter.getRequired('DATABASE_URL', Converters.Url);
export const secret: string = Envapter.getRequired('SECRET', (raw) => raw.trim());
export const level: 'debug' | 'info' = Envapter.getRequired('LOG_LEVEL', levelSchema);

const config = Envapter.getRequiredAll({
    DATABASE_URL: Converters.Url,
    POOL_SIZE: Converters.Integer,
    LOG_LEVEL: levelSchema,
    ORIGINS: Converters.array({ of: Converters.Url })
});
export const configUrl: URL = config.DATABASE_URL;
export const configPool: number = config.POOL_SIZE;
export const configLevel: 'debug' | 'info' = config.LOG_LEVEL;
export const configOrigins: URL[] = config.ORIGINS;

const camel = Envapter.getRequiredAll(
    { DATABASE_URL: Converters.Url, OAUTH2_CLIENT_ID: Converters.String },
    'camelCase'
);
export const camelUrl: URL = camel.databaseUrl;
export const camelClient: string = camel.oauth2ClientId;
export const kebabPort: number = Envapter.getRequiredAll({ API_PORT: Converters.Port }, 'kebab-case')['api-port'];

export const raw: string | undefined = Envapter.getRaw('SUBJECT_TEMPLATE');
export const hasRedis: boolean = Envapter.has('REDIS_URL');
Envapter.require('DATABASE_URL', ['READONLY_URL', 'DATABASE_URL']);
export const banner: string = Envapter.resolve`${'APP_NAME'} on ${'HOST'}`;

export const environment: Environment = Envapter.environment;
export const keys: readonly string[] = ENVIRONMENT_KEYS;
export const isNamedEnvironment: boolean =
    Envapter.isProduction || Envapter.isStaging || Envapter.isDevelopment || Envapter.isTest;
Envapter.environment = Environment.Staging;
Envapter.environment = 'production';

const level2: DebugLevel = 'warn';
Envapter.debug = level2;
const mode: FileApiMode = 'throw';
Envapter.fileApiMode = mode;
Envapter.strict = true;
Envapter.syncProcessEnv = true;
Envapter.envPaths = ['.env', '.env.extra'];
Envapter.envPaths = '.env';
Envapter.baseDir = '/srv/app';
Envapter.baseDir = new URL('file:///srv/app/');
Envapter.baseDir = undefined;
const options: EnvFileOptions = { override: true, encoding: 'utf8' };
Envapter.envFileOptions = options;
const profile: EnvProfile = { paths: ['.env.production'] };
const profiles: ProfilesConfig = { [Environment.Production]: profile };
Envapter.configureProfiles(profiles);
Envapter.resetPaths();

const custom: Source = { readVars: () => ({ A: '1' }) };
Envapter.useSource(custom);
Envapter.useSource(new PortableSource({ A: '1', B: 2, C: true, D: null, E: undefined }));
Envapter.useSource(merge(new FileSource(), new PortableSource({ X: '1' })));
Envapter.useSource((key) => (key === 'A' ? '1' : undefined));

const timeFallback: TimeFallback = '15m';
export const fromTimeFallback: number = Envapter.getAs('TTL', Converters.Time, timeFallback);

class Config extends Envapter {
    static get origin(): string {
        return `http://${Config.get('HOST', 'localhost')}:${Config.getAs('PORT', Converters.Port, 3000)}`;
    }
}
export const origin: string = Config.origin;

try {
    Envapter.getRequired('X', Converters.Url);
} catch (error) {
    if (error instanceof EnvaptError && error.code === EnvaptErrorCodes.InvalidEnvValue) {
        const issues = error.issues ?? [];
        void issues;
    }
}
