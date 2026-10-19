import { afterEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptError, EnvaptErrorCodes, PortableSource } from '../../dist/portable/index.mjs';

afterEach(() => {
    Envapter.strict = false;
});

describe('converters on workerd', () => {
    it('coerces non-string bindings and reads them back typed', () => {
        Envapter.useSource(new PortableSource({ PORT: 8080, ENABLED: true, CFG: { a: 1 } }));
        expect(Envapter.getAs('PORT', Converters.Port)).toBe(8080);
        expect(Envapter.getAs('ENABLED', Converters.Boolean)).toBe(true);
        expect(Envapter.getAs('CFG', Converters.Json)).toEqual({ a: 1 });
    });

    it('applies url, regexp, date, and time converters', () => {
        Envapter.useSource(
            new PortableSource({
                URL: 'https://x.test/p',
                RE: '^a.c$',
                WHEN: '2020-01-02T03:04:05.000Z',
                TTL: '1.5h'
            })
        );
        expect(Envapter.getAs('URL', Converters.Url)?.host).toBe('x.test');
        expect(Envapter.getAs('RE', Converters.RegExp)?.test('abc')).toBe(true);
        expect(Envapter.getAs('WHEN', Converters.Date)?.getUTCFullYear()).toBe(2020);
        expect(Envapter.getAs('TTL', Converters.Time)).toBe(5_400_000);
    });

    it('reads a delimited array binding', () => {
        Envapter.useSource(new PortableSource({ HOSTS: 'a.test;b.test' }));
        const hosts = Envapter.getAs('HOSTS', Converters.array({ of: Converters.String, delimiter: ';' }));
        expect(hosts).toEqual(['a.test', 'b.test']);
    });
});

describe('strict mode and require on workerd', () => {
    it('throws MissingEnvValue (305) for a missing strict template read', () => {
        Envapter.useSource(new PortableSource({ PRESENT: 'yes' }));
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
        Envapter.useSource(new PortableSource({ A: '1' }));
        try {
            Envapter.require('A', 'B');
            expect.unreachable('require should throw when B is missing');
        } catch (err) {
            expect(err).toBeInstanceOf(EnvaptError);
            expect((err as EnvaptError).code).toBe(EnvaptErrorCodes.MissingEnvValue);
        }
    });
});
