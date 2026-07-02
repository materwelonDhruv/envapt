import { afterEach, describe, expect, it, vi } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes } from '../src/index.portable';

describe('portable file-API behavior', () => {
    afterEach(() => {
        Envapter.fileApiMode = 'warn';
    });

    it('no-ops every file API under the default warn mode', () => {
        Envapter.baseDir = '/x';
        expect(Envapter.envPaths).toEqual([]);
        expect(Envapter.baseDir).toBeUndefined();
        expect(Envapter.envFileOptions).toEqual({});
        expect(() => Envapter.configureProfiles({ useDefaults: false })).not.toThrow();
        expect(() => Envapter.resetProfiles()).not.toThrow();
    });

    it('restores FileApiUnsupported on every file API under throw mode', () => {
        Envapter.fileApiMode = 'throw';
        const throws306 = (fn: () => unknown): void => {
            expect(fn).to.throw(EnvaptError).with.property('code', EnvaptErrorCodes.FileApiUnsupported);
        };
        throws306(() => Envapter.envPaths);
        throws306(() => {
            Envapter.envPaths = '.env';
        });
        throws306(() => Envapter.baseDir);
        throws306(() => {
            Envapter.baseDir = '/x';
        });
        throws306(() => Envapter.envFileOptions);
        throws306(() => {
            Envapter.envFileOptions = {};
        });
        throws306(() => Envapter.configureProfiles({ useDefaults: false }));
        throws306(() => Envapter.resetProfiles());
    });

    // Fresh module so the module-level warned set is empty and the warning routes to console.error (a
    // NodeEnvapter import anywhere in the graph would route it to process.stderr instead).
    it('warns once per api under warn mode', async () => {
        vi.resetModules();
        const { Envapter: Portable } = await import('../src/index.portable');
        const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        void Portable.envPaths;
        void Portable.envPaths;
        Portable.baseDir = '/x';

        const lines = spy.mock.calls.map((call) => String(call[0])).filter((line) => line.includes('[envapt]'));
        spy.mockRestore();
        expect(lines.filter((line) => line.includes('envPaths'))).toHaveLength(1);
        expect(lines.filter((line) => line.includes('baseDir'))).toHaveLength(1);
    });

    it('still throws NoSourceBound on first read under warn mode', async () => {
        vi.resetModules();
        const {
            Envapter: Portable,
            EnvaptError: PortableError,
            EnvaptErrorCodes: Codes
        } = await import('../src/index.portable');
        expect(() => Portable.get('ANY'))
            .to.throw(PortableError)
            .with.property('code', Codes.NoSourceBound);
    });
});
