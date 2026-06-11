import { afterEach, describe, expect, it } from 'vitest';

import { Envapter, ManualEnvSource, NodeEnvSource } from '../src';

import type { EnvSource } from '../src';

describe('EnvSource', () => {
    afterEach(() => {
        // Restore the default Node source so the rest of the suite sees process.env + .env again.
        Envapter.useSource(new NodeEnvSource());
    });

    it('reads typed values from an injected ManualEnvSource (no process.env, no .env file)', () => {
        Envapter.useSource(new ManualEnvSource({ FOO: 'bar', PORT: '3000', FLAG: 'true' }));

        expect(Envapter.get('FOO')).to.equal('bar');
        expect(Envapter.getNumber('PORT')).to.equal(3000);
        expect(Envapter.getBoolean('FLAG')).to.equal(true);
    });

    it('snapshots the object at construction (later mutation does not leak in)', () => {
        const vars = { TOKEN: 'abc' };
        const source = new ManualEnvSource(vars);
        vars.TOKEN = 'changed';

        Envapter.useSource(source);

        expect(Envapter.get('TOKEN')).to.equal('abc');
    });

    it('accepts any object satisfying the EnvSource contract', () => {
        const custom: EnvSource = { readVars: () => ({ CUSTOM: 'yes' }) };
        Envapter.useSource(custom);

        expect(Envapter.get('CUSTOM')).to.equal('yes');
    });
});
