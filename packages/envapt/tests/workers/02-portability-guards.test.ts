import { afterEach, describe, expect, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, PortableSource } from '../../dist/portable/index.mjs';

describe('portable build guards on workerd', () => {
    afterEach(() => {
        Envapter.fileApiMode = 'warn';
    });

    it('no-ops a file API under the default warn mode', () => {
        Envapter.useSource(new PortableSource({ FOO: 'bar' }));
        expect(() => (Envapter.baseDir = '/tmp')).not.toThrow();
        expect(Envapter.baseDir).toBeUndefined();
    });

    it('throws FileApiUnsupported (306) under throw mode', () => {
        Envapter.fileApiMode = 'throw';
        try {
            Envapter.baseDir = '/tmp';
            expect.unreachable('baseDir setter should throw under throw mode');
        } catch (err) {
            expect(err).toBeInstanceOf(EnvaptError);
            expect((err as EnvaptError).code).toBe(EnvaptErrorCodes.FileApiUnsupported);
        }
    });

    it('reads injected config from a PortableSource', () => {
        Envapter.useSource(new PortableSource({ FLAG: 'true', COUNT: '42' }));
        expect(Envapter.getBoolean('FLAG')).toBe(true);
        expect(Envapter.getNumber('COUNT')).toBe(42);
    });
});
