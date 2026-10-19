import { Converters, Envapt } from 'envapt';

import { levelSchema } from './schemas.mjs';

export class Config {
    @Envapt('PORT', { converter: Converters.Port, fallback: 3000 })
    static accessor port: number;

    @Envapt('RETRIES', { fallback: 3 })
    static accessor retries: number;

    @Envapt('REGION', { fallback: 'us-east-1' })
    static accessor region: string;

    @Envapt('BETA', { fallback: false })
    static accessor beta: boolean;

    @Envapt('API_URL', { converter: Converters.Url })
    static accessor apiUrl: URL | undefined;

    @Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
    static accessor databaseUrl: URL;

    @Envapt('SECRET', { required: true })
    static accessor secret: string;

    @Envapt('APP_NAME')
    static accessor appName: string | undefined;

    @Envapt('MODE', { fallback: 'x', converter: undefined })
    static accessor mode: string;

    @Envapt('CACHE_TTL', { converter: Converters.Time, fallback: '15m' })
    static accessor cacheTtl: number;

    @Envapt('ORIGINS', { converter: Converters.array({ of: Converters.Url }), fallback: [] })
    static accessor origins: URL[];

    @Envapt('HOSTS', { converter: (raw) => raw.split(','), fallback: ['localhost'] })
    static accessor hosts: string[];

    @Envapt('POOL', { converter: (raw) => Number(raw) })
    static accessor pool: number | undefined;

    @Envapt('LEVEL', { schema: levelSchema, fallback: 'info' })
    static accessor level: 'debug' | 'info';

    @Envapt('LEVEL', { schema: levelSchema, required: true })
    static accessor requiredLevel: 'debug' | 'info';

    @Envapt('INSTANCE_NAME', { fallback: 'worker' })
    accessor instanceName!: string;
}
