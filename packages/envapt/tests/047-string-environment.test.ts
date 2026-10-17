import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

import { Envapter, FileSource, PortableSource } from '../src';

describe('string Environment (v9)', () => {
    afterEach(() => {
        Envapter.useSource(new FileSource());
        Envapter.resetPaths();
    });

    it('reads the environment as its lowercase name', () => {
        Envapter.useSource(new PortableSource({ NODE_ENV: 'production' }));
        expect(Envapter.environment).to.equal('production');
        expectTypeOf(Envapter.environment).toEqualTypeOf<'development' | 'staging' | 'production' | 'test'>();
    });
});
