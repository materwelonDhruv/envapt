import { beforeEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, ManualEnvSource } from '../../dist/browser/index.mjs';

describe('envapt in the browser', () => {
    beforeEach(() => {
        Envapter.useSource(new ManualEnvSource({ APP: 'web', PORT: '443', FLAG: 'true', API: 'https://api.test/v1' }));
    });

    it('reads typed values from an injected source', () => {
        expect(Envapter.get('APP')).toBe('web');
        expect(Envapter.getNumber('PORT')).toBe(443);
        expect(Envapter.getBoolean('FLAG')).toBe(true);
        expect(Envapter.getUsing('API', Converters.Url)?.href).toBe('https://api.test/v1');
    });
});
