import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, ManualEnvSource, NodeEnvSource } from '../src';

import type { FileApiMode } from '../src';

const extraFixture = resolve(import.meta.dirname, '.env.extra');
const MODES: readonly FileApiMode[] = ['warn', 'throw'];

describe('Envapter.fileApiMode (node build)', () => {
    afterEach(() => {
        Envapter.fileApiMode = 'warn';
        Envapter.useSource(new NodeEnvSource());
        Envapter.resetProfiles();
    });

    it('defaults to warn', () => {
        expect(Envapter.fileApiMode).toBe('warn');
    });

    it('round-trips between warn and throw', () => {
        Envapter.fileApiMode = 'throw';
        expect(Envapter.fileApiMode).toBe('throw');
        Envapter.fileApiMode = 'warn';
        expect(Envapter.fileApiMode).toBe('warn');
    });

    it('rejects an invalid value with InvalidUserDefinedConfig (302)', () => {
        // justified: bypass the compile-time union to exercise the runtime guard
        expect(() => (Envapter.fileApiMode = 'loud' as unknown as FileApiMode))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('runs the node file APIs under both modes with a filesystem source', () => {
        for (const mode of MODES) {
            Envapter.useSource(new NodeEnvSource());
            Envapter.fileApiMode = mode;
            Envapter.envPaths = extraFixture;
            expect(Envapter.envPaths).toEqual([extraFixture]);
            expect(Envapter.getBoolean('VAR_IN_EXTRA_FILE')).toBe(true);
        }
    });

    it('throws FileApiUnsupported (306) on a bare source under both modes', () => {
        for (const mode of MODES) {
            Envapter.useSource(new ManualEnvSource({ FOO: 'bar' }));
            Envapter.fileApiMode = mode;
            expect(() => (Envapter.envPaths = '.env'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FileApiUnsupported);
        }
    });
});
