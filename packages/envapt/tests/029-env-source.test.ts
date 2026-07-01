import { afterEach, describe, expect, it } from 'vitest';

// eslint-disable-next-line import/no-deprecated -- guards the deprecated v7 aliases (ManualEnvSource/WorkerEnvSource) until v8 removes them
import { Envapter, ManualEnvSource, NodeEnvSource, PortableSource, WorkerEnvSource } from '../src';

import type { EnvSource } from '../src';

describe('deprecated source aliases (v7 back-compat)', () => {
    afterEach(() => {
        // Restore the default Node source so the rest of the suite sees process.env + .env again.
        Envapter.useSource(new NodeEnvSource());
    });

    it('still reads typed values from an injected ManualEnvSource', () => {
        // eslint-disable-next-line import/no-deprecated -- exercising the deprecated alias on purpose
        Envapter.useSource(new ManualEnvSource({ FOO: 'bar', PORT: '3000', FLAG: 'true' }));

        expect(Envapter.get('FOO')).to.equal('bar');
        expect(Envapter.getNumber('PORT')).to.equal(3000);
        expect(Envapter.getBoolean('FLAG')).to.equal(true);
    });

    it('exposes ManualEnvSource and WorkerEnvSource as PortableSource subclasses', () => {
        // eslint-disable-next-line import/no-deprecated -- exercising the deprecated aliases on purpose
        expect(new ManualEnvSource({ A: '1' }) instanceof PortableSource).to.equal(true);
        // eslint-disable-next-line import/no-deprecated -- exercising the deprecated aliases on purpose
        expect(new WorkerEnvSource({ B: '2' }) instanceof PortableSource).to.equal(true);
    });

    it('still accepts any object satisfying the deprecated EnvSource contract', () => {
        const custom: EnvSource = { readVars: () => ({ CUSTOM: 'yes' }) };
        Envapter.useSource(custom);

        expect(Envapter.get('CUSTOM')).to.equal('yes');
    });
});
