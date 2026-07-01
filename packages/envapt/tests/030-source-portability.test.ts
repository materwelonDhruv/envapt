import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes, NodeEnvSource, PortableSource } from '../src';
import { EnvapterBase } from '../src/core/EnvapterBase';
import { EnvaptError } from '../src/infra/Error';
import { UnboundEnvSource } from '../src/sources/UnboundEnvSource';

import type { Source } from '../src';

// An interface has no index signature, mirroring a Cloudflare `Env` binding, the shape PortableSource must accept.
interface CloudflareLikeEnv {
    APP_NAME: string;
    PORT: string;
}

describe('Source portability (v5.2)', () => {
    afterEach(() => {
        // setup.ts binds NodeEnvSource per file, so restore it and reset path config after any swap
        // so later tests see a clean Node default.
        Envapter.useSource(new NodeEnvSource());
        Envapter.resetProfiles();
    });

    describe('UnboundEnvSource', () => {
        it('throws NoSourceBound on read', () => {
            expect(() => new UnboundEnvSource().readVars())
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.NoSourceBound);
        });
    });

    describe('file-API guards on a source without filesystem support', () => {
        it('envPaths throws FileApiUnsupported', () => {
            Envapter.useSource(new PortableSource({ FOO: 'bar' }));
            expect(() => (Envapter.envPaths = '.env'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FileApiUnsupported);
        });

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
            // undefined value exercises the skip branch
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

        it('feeds typed values through the engine', () => {
            Envapter.useSource(new PortableSource({ PORT: 3000, FLAG: true, CFG: { a: 1 } }));
            expect(Envapter.getNumber('PORT')).to.equal(3000);
            expect(Envapter.getBoolean('FLAG')).to.equal(true);
            expect(Envapter.getUsing('CFG', Converters.Json)).to.deep.equal({ a: 1 });
        });

        it('accepts an import.meta.env-shaped object straight through', () => {
            // Vite's import.meta.env mixes string VITE_* vars with boolean DEV/PROD/SSR flags.
            Envapter.useSource(
                new PortableSource({ VITE_API_URL: 'https://api.example.com', DEV: true, MODE: 'production' })
            );
            expect(Envapter.getUsing('VITE_API_URL', Converters.Url)?.href).to.equal('https://api.example.com/');
            expect(Envapter.getBoolean('DEV')).to.equal(true);
            expect(Envapter.get('MODE')).to.equal('production');
        });

        it('accepts any object satisfying the Source contract', () => {
            const custom: Source = { readVars: () => ({ CUSTOM: 'yes' }) };
            Envapter.useSource(custom);
            expect(Envapter.get('CUSTOM')).to.equal('yes');
        });

        it('accepts an interface-typed binding with no index signature (a Cloudflare Env)', () => {
            const binding: CloudflareLikeEnv = { APP_NAME: 'envapt', PORT: '3000' };
            Envapter.useSource(new PortableSource(binding));
            expect(Envapter.get('APP_NAME')).to.equal('envapt');
            expect(Envapter.getNumber('PORT')).to.equal(3000);
        });
    });

    describe('NodeEnvapter state anchoring', () => {
        it('writes envPaths to EnvapterBase, where the engine reads it', () => {
            // A mis-anchored setter (writing this._envPaths) is behaviorally invisible because its own
            // refresh warms the shared cache, so this pins that the write happens on EnvapterBase.
            // pragmatic white-box read of protected state -- justified, asserts where the write landed
            const base = EnvapterBase as unknown as { _envPaths: string[] };
            const fixture = resolve(import.meta.dirname, '.env.extra');
            Envapter.envPaths = fixture;
            expect(base._envPaths).to.deep.equal([fixture]);
        });
    });
});
