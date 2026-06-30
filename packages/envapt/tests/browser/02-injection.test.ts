import { afterEach, describe, expect, it } from 'vitest';

import { Envapter, ManualEnvSource } from '../../dist/portable/index.mjs';

describe('browser config injection', () => {
    afterEach(() => {
        const win = window as Window & { __ENV__?: Record<string, unknown> };
        delete win.__ENV__;
    });

    it('reads typed values from an import.meta.env-shaped object', () => {
        const injected = { ...import.meta.env, VITE_API: 'https://x.test', VITE_PORT: '3000' };
        Envapter.useSource(new ManualEnvSource(injected));
        expect(Envapter.get('VITE_API')).toBe('https://x.test');
        expect(Envapter.getNumber('VITE_PORT')).toBe(3000);
    });

    it('reads from a window.__ENV__ runtime injection', () => {
        const win = window as Window & { __ENV__?: Record<string, unknown> };
        win.__ENV__ = { RUNTIME_FLAG: 'true', LIMIT: '5' };
        Envapter.useSource(new ManualEnvSource(win.__ENV__));
        expect(Envapter.getBoolean('RUNTIME_FLAG')).toBe(true);
        expect(Envapter.getNumber('LIMIT')).toBe(5);
    });
});
