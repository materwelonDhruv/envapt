import { afterEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptError, EnvaptErrorCodes, ManualEnvSource } from '../../dist/portable/index.mjs';

afterEach(() => {
    Envapter.strict = false;
});

describe('converters on workerd', () => {
    it('coerces non-string bindings and reads them back typed', () => {
        Envapter.useSource(new ManualEnvSource({ PORT: 8080, ENABLED: true, CFG: { a: 1 } }));
        expect(Envapter.getNumber('PORT')).toBe(8080);
        expect(Envapter.getBoolean('ENABLED')).toBe(true);
        expect(Envapter.getUsing('CFG', Converters.Json)).toEqual({ a: 1 });
    });

    it('applies url, regexp, date, and time converters', () => {
        Envapter.useSource(
            new ManualEnvSource({
                URL: 'https://x.test/p',
                RE: '^a.c$',
                WHEN: '2020-01-02T03:04:05.000Z',
                TTL: '1.5h'
            })
        );
        expect(Envapter.getUsing('URL', Converters.Url)?.host).toBe('x.test');
        expect(Envapter.getUsing('RE', Converters.Regexp)?.test('abc')).toBe(true);
        expect(Envapter.getUsing('WHEN', Converters.Date)?.getUTCFullYear()).toBe(2020);
        expect(Envapter.getUsing('TTL', Converters.Time)).toBe(5_400_000);
    });

    it('reads a delimited array binding', () => {
        Envapter.useSource(new ManualEnvSource({ HOSTS: 'a.test;b.test' }));
        const hosts = Envapter.getUsing('HOSTS', Converters.array({ of: Converters.String, delimiter: ';' }));
        expect(hosts).toEqual(['a.test', 'b.test']);
    });
});

describe('strict mode and require on workerd', () => {
    it('throws MissingEnvValue (305) for a missing strict template read', () => {
        Envapter.useSource(new ManualEnvSource({ PRESENT: 'yes' }));
        Envapter.strict = true;
        try {
            Envapter.resolve`${'ABSENT'}`;
            expect.unreachable('strict resolve of a missing var should throw');
        } catch (err) {
            expect(err).toBeInstanceOf(EnvaptError);
            expect((err as EnvaptError).code).toBe(EnvaptErrorCodes.MissingEnvValue);
        }
    });

    it('require() throws when a key is missing', () => {
        Envapter.useSource(new ManualEnvSource({ A: '1' }));
        try {
            Envapter.require('A', 'B');
            expect.unreachable('require should throw when B is missing');
        } catch (err) {
            expect(err).toBeInstanceOf(EnvaptError);
            expect((err as EnvaptError).code).toBe(EnvaptErrorCodes.MissingEnvValue);
        }
    });
});
