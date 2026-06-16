import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes, ManualEnvSource, NodeEnvSource, WorkerEnvSource } from '../src';
import { EnvapterBase } from '../src/core/EnvapterBase';
import { EnvaptError } from '../src/infra/Error';
import { UnboundEnvSource } from '../src/sources/UnboundEnvSource';

describe('Source portability (v5.2)', () => {
    afterEach(() => {
        // setup.ts binds NodeEnvSource per file; restore it + reset path config after any swap so
        // later tests see a clean Node default.
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
            Envapter.useSource(new ManualEnvSource({ FOO: 'bar' }));
            expect(() => (Envapter.envPaths = '.env'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FileApiUnsupported);
        });

        it('baseDir throws FileApiUnsupported', () => {
            Envapter.useSource(new ManualEnvSource({ FOO: 'bar' }));
            expect(() => (Envapter.baseDir = '/tmp'))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FileApiUnsupported);
        });

        it('configureProfiles throws FileApiUnsupported', () => {
            Envapter.useSource(new ManualEnvSource({ FOO: 'bar' }));
            expect(() => Envapter.configureProfiles({ useDefaults: false }))
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.FileApiUnsupported);
        });
    });

    describe('WorkerEnvSource', () => {
        it('passes strings through and JSON-stringifies non-string bindings', () => {
            const source = new WorkerEnvSource({ STR: 'x', NUM: 3000, FLAG: true, CFG: { a: 1 } });
            expect(source.readVars()).to.deep.equal({
                STR: 'x',
                NUM: '3000',
                FLAG: 'true',
                CFG: '{"a":1}'
            });
        });

        it('skips bindings that stringify to undefined', () => {
            // intentionally undefined binding to exercise the skip branch -- justified
            const source = new WorkerEnvSource({ KEEP: 'yes', DROP: undefined });
            expect(source.readVars()).to.deep.equal({ KEEP: 'yes' });
        });

        it('feeds typed values through the engine', () => {
            Envapter.useSource(new WorkerEnvSource({ PORT: 3000, FLAG: true, CFG: { a: 1 } }));
            expect(Envapter.getNumber('PORT')).to.equal(3000);
            expect(Envapter.getBoolean('FLAG')).to.equal(true);
            expect(Envapter.getUsing('CFG', Converters.Json)).to.deep.equal({ a: 1 });
        });
    });

    describe('ManualEnvSource', () => {
        it('passes strings through and JSON-stringifies non-string values', () => {
            const source = new ManualEnvSource({ STR: 'x', NUM: 3000, FLAG: true, CFG: { a: 1 } });
            expect(source.readVars()).to.deep.equal({
                STR: 'x',
                NUM: '3000',
                FLAG: 'true',
                CFG: '{"a":1}'
            });
        });

        it('accepts an import.meta.env-shaped object straight through', () => {
            // Vite's import.meta.env mixes string VITE_* vars with boolean DEV/PROD/SSR flags.
            Envapter.useSource(
                new ManualEnvSource({ VITE_API_URL: 'https://api.example.com', DEV: true, MODE: 'production' })
            );
            expect(Envapter.getUsing('VITE_API_URL', Converters.Url)?.href).to.equal('https://api.example.com/');
            expect(Envapter.getBoolean('DEV')).to.equal(true);
            expect(Envapter.get('MODE')).to.equal('production');
        });
    });

    describe('NodeEnvapter state anchoring', () => {
        it('writes envPaths to EnvapterBase, where the engine reads it', () => {
            // A mis-anchored setter (writing `this._envPaths`) is behaviorally invisible: its own
            // refresh warms the shared cache, so this pins that the write happens on EnvapterBase.
            // pragmatic white-box read of protected state -- justified: asserts where the write landed
            const base = EnvapterBase as unknown as { _envPaths: string[] };
            const fixture = resolve(import.meta.dirname, '.env.extra');
            Envapter.envPaths = fixture;
            expect(base._envPaths).to.deep.equal([fixture]);
        });
    });
});
