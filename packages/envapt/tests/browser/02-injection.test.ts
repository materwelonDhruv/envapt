import { afterEach, describe, expect, it } from 'vitest';

import { Envapter, PortableSource } from '../../dist/portable/index.mjs';

describe('browser config injection', () => {
    afterEach(() => {
        const win = window as Window & { __ENV__?: Record<string, unknown> };
        delete win.__ENV__;
    });

    it('reads from an import.meta.env-shaped object', () => {
        const injected = { ...import.meta.env, VITE_API: 'https://x.test' };
        Envapter.useSource(new PortableSource(injected));
        expect(Envapter.get('VITE_API')).toBe('https://x.test');
    });

    it('reads from a window.__ENV__ runtime injection', () => {
        const win = window as Window & { __ENV__?: Record<string, unknown> };
        win.__ENV__ = { LIMIT: '5' };
        Envapter.useSource(new PortableSource(win.__ENV__));
        expect(Envapter.get('LIMIT')).toBe('5');
    });
});
