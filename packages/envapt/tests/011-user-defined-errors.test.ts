import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter } from '../src';
import { Envapt } from '../src/legacy';

function validKey(raw: string): string {
    if (!raw.startsWith('valid_')) throw new Error('expected a key starting with valid_');
    return raw;
}

describe('custom converters on @Envapt', () => {
    beforeAll(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.user-defined-errors`)));

    class Config {
        @Envapt('API_KEY', { converter: validKey })
        public static readonly apiKey: string | undefined;

        @Envapt('DATABASE_URL', { converter: validKey })
        public static readonly databaseUrl: string | undefined;

        @Envapt('SECRET_TOKEN', { converter: validKey })
        public static readonly secretToken: string | undefined;

        @Envapt('SECRET_TOKEN', { converter: validKey, fallback: 'valid_default' })
        public static readonly secretTokenWithFallback: string;

        @Envapt('REQUIRED_CONFIG', { converter: validKey })
        declare public readonly requiredConfig: string | undefined;
    }

    it('returns the converted value for a present variable', () => {
        expect(Config.apiKey).to.equal('valid_api_key_12345');
    });

    it("passes the converter's own error through for a present variable", () => {
        expect(() => Config.databaseUrl).to.throw('expected a key starting with valid_');
    });

    it('returns undefined for a missing variable without calling the converter', () => {
        expect(Config.secretToken).to.be.undefined;
        expect(new Config().requiredConfig).to.be.undefined;
    });

    it('returns the fallback for a missing variable without calling the converter', () => {
        expect(Config.secretTokenWithFallback).to.equal('valid_default');
    });
});
