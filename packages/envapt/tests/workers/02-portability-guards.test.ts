import { describe, expect, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, ManualEnvSource } from '../../dist/portable/index.mjs';

describe('portable build guards on workerd', () => {
    it('throws FileApiUnsupported (306) when a filesystem API is used', () => {
        Envapter.useSource(new ManualEnvSource({ FOO: 'bar' }));
        try {
            (Envapter as unknown as { baseDir: string }).baseDir = '/tmp';
            expect.unreachable('baseDir setter should throw');
        } catch (err) {
            expect(err).toBeInstanceOf(EnvaptError);
            expect((err as EnvaptError).code).toBe(EnvaptErrorCodes.FileApiUnsupported);
        }
    });

    it('reads injected config from a ManualEnvSource', () => {
        Envapter.useSource(new ManualEnvSource({ FLAG: 'true', COUNT: '42' }));
        expect(Envapter.getBoolean('FLAG')).toBe(true);
        expect(Envapter.getNumber('COUNT')).toBe(42);
    });
});
