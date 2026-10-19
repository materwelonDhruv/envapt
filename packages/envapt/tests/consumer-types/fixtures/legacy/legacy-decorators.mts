import { Converters } from 'envapt';
import { Envapt } from 'envapt/legacy';

import { levelSchema } from '../schemas.mjs';

import type { EnvaptFieldDecorator } from 'envapt/legacy';

export class Config {
    @Envapt('PORT', { converter: Converters.Port, fallback: 3000 })
    static readonly port: number;

    @Envapt('RETRIES', { fallback: 3 })
    static readonly retries: number;

    @Envapt('REGION', { fallback: 'us-east-1' })
    static readonly region: string;

    @Envapt('BETA', { fallback: false })
    static readonly beta: boolean;

    @Envapt('API_URL', { converter: Converters.Url })
    static readonly apiUrl: URL | undefined;

    @Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
    static readonly databaseUrl: URL;

    @Envapt('SECRET', { required: true })
    static readonly secret: string;

    @Envapt('APP_NAME')
    static readonly appName: string | undefined;

    @Envapt('MODE', { fallback: 'x', converter: undefined })
    static readonly mode: string;

    @Envapt('CACHE_TTL', { converter: Converters.Time, fallback: '15m' })
    static readonly cacheTtl: number;

    @Envapt('HOSTS', { converter: (raw) => raw.split(','), fallback: ['localhost'] })
    static readonly hosts: string[];

    @Envapt('LEVEL', { schema: levelSchema, fallback: 'info' })
    static readonly level: 'debug' | 'info';

    @Envapt('INSTANCE_NAME', { fallback: 'worker' })
    declare readonly instanceName: string;
}

export const decorator: EnvaptFieldDecorator<number> = Envapt('PORT', { fallback: 3000 });
