import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';

import { Converters, Envapter, EnvaptErrorCodes, ManualEnvSource, NodeEnvSource, WorkerEnvSource } from '../src';
import { EnvaptError } from '../src/Error';
import { UnboundEnvSource } from '../src/sources/UnboundEnvSource';

describe('Source portability (v5.2)', () => {
    afterEach(() => {
        // setup.ts binds NodeEnvSource per file; restore it after any swap so later tests see Node again.
        Envapter.useSource(new NodeEnvSource());
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
});
