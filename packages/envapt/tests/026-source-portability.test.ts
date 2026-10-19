import { afterEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptError, EnvaptErrorCodes, FileSource, PortableSource } from '../src';

import type { Source } from '../src';

describe('Source portability (v5.2)', () => {
    afterEach(() => {
        // tests here swap the source. setup.ts only binds FileSource once per file
        Envapter.useSource(new FileSource());
        Envapter.resetPaths();
    });

    describe('file-API guards on a source without filesystem support', () => {
        it('baseDir throws FileApiUnsupported', () => {
            Envapter.useSource(new PortableSource({ FOO: 'bar' }));
            expect(() => (Envapter.baseDir = '/tmp'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FileApiUnsupported);
        });

        it('configureProfiles throws FileApiUnsupported', () => {
            Envapter.useSource(new PortableSource({ FOO: 'bar' }));
            expect(() => Envapter.configureProfiles({ useDefaults: false }))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FileApiUnsupported);
        });
    });

    describe('PortableSource', () => {
        it('passes strings through and JSON-stringifies non-string values', () => {
            const source = new PortableSource({ STR: 'x', NUM: 3000, FLAG: true, CFG: { a: 1 } });
            expect(source.readVars()).to.deep.equal({
                STR: 'x',
                NUM: '3000',
                FLAG: 'true',
                CFG: '{"a":1}'
            });
        });

        it('skips values that stringify to undefined', () => {
            const source = new PortableSource({ KEEP: 'yes', DROP: undefined });
            expect(source.readVars()).to.deep.equal({ KEEP: 'yes' });
        });

        it('snapshots the object at construction, so later mutation does not leak in', () => {
            const vars = { TOKEN: 'abc' };
            const source = new PortableSource(vars);
            vars.TOKEN = 'changed';
            Envapter.useSource(source);
            expect(Envapter.get('TOKEN')).to.equal('abc');
        });

        it('accepts an import.meta.env-shaped object straight through', () => {
            // Vite's import.meta.env mixes string VITE_* vars with boolean DEV/PROD/SSR flags.
            Envapter.useSource(
                new PortableSource({ VITE_API_URL: 'https://api.example.com', DEV: true, MODE: 'production' })
            );
            expect(Envapter.getAs('VITE_API_URL', Converters.Url)?.href).to.equal('https://api.example.com/');
            expect(Envapter.getAs('DEV', Converters.Boolean)).to.equal(true);
            expect(Envapter.get('MODE')).to.equal('production');
        });

        it('accepts any object satisfying the Source contract', () => {
            const custom: Source = { readVars: () => ({ CUSTOM: 'yes' }) };
            Envapter.useSource(custom);
            expect(Envapter.get('CUSTOM')).to.equal('yes');
        });
    });
});
