import { afterEach, describe, expect, it, vi } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, PortableSource } from '../../dist/portable/index.mjs';

afterEach(() => {
    Envapter.strict = false;
    Envapter.debug = 'silent';
});

describe('browser portability canaries', () => {
    it('a missing strict read throws EnvaptError, never a process ReferenceError', () => {
        Envapter.useSource(new PortableSource({ PRESENT: 'x' }));
        Envapter.strict = true;
        let err: unknown;
        try {
            Envapter.resolve`${'ABSENT'}`;
        } catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(EnvaptError);
        expect((err as EnvaptError).code).toBe(EnvaptErrorCodes.MissingEnvValue);
    });

    it('routes debug output to console, not process.stderr', () => {
        Envapter.useSource(new PortableSource({ PRESENT: 'x' }));
        Envapter.debug = 'warn';
        const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        Envapter.get('MISSING_VAR', 'fallback-value');
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls.some((call) => String(call[0]).includes('[envapt]'))).toBe(true);
        spy.mockRestore();
    });
});
