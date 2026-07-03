import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { Envapter, EnvaptError, EnvaptErrorCodes, FileSource, merge, PortableSource } from '../src';

import type { FileCapableSource } from '../src/types';

describe('merge composes sources with last-wins precedence', () => {
    afterEach(() => {
        Envapter.useSource(new FileSource());
        Envapter.baseDir = undefined;
        Envapter.resetProfiles();
        Envapter.envFileOptions = {};
        Envapter.syncProcessEnv = false;
        delete process.env.FROM_FILE;
        delete process.env.SHARED;
        delete process.env.SECRET;
    });

    it('layers members last-wins, a later member overrides an earlier key', () => {
        Envapter.useSource(
            merge(new PortableSource({ A: '1', SHARED: 'first' }), new PortableSource({ SHARED: 'second', B: '2' }))
        );

        expect(Envapter.get('A')).to.equal('1');
        expect(Envapter.get('B')).to.equal('2');
        expect(Envapter.get('SHARED')).to.equal('second');
    });

    it('keeps the .env cascade through a single file member, later members win over it', () => {
        Envapter.useSource(merge(new FileSource(), new PortableSource({ SHARED: 'secret', FROM_SECRET: 'secret' })));
        Envapter.envPaths = resolve(import.meta.dirname, '.env.041-merge');

        expect(Envapter.get('FROM_FILE')).to.equal('file');
        expect(Envapter.get('SHARED')).to.equal('secret');
        expect(Envapter.get('FROM_SECRET')).to.equal('secret');
    });

    it('throws InvalidMergedSource when given no members', () => {
        expect(() => merge())
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidMergedSource);
    });

    it('throws InvalidMergedSource when given more than one file-capable member', () => {
        expect(() => merge(new FileSource(), new FileSource()))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidMergedSource);
    });

    it('resolves a relative .env path against baseDir through the file member', () => {
        Envapter.useSource(merge(new FileSource(), new PortableSource({ X: '1' })));
        Envapter.baseDir = import.meta.dirname;
        Envapter.envPaths = ['.env.041-merge'];

        expect(Envapter.get('FROM_FILE')).to.equal('file');
    });

    it('mirrors the .env delta to process.env through the file member when syncProcessEnv is on', () => {
        Envapter.syncProcessEnv = true;
        Envapter.useSource(merge(new FileSource(), new PortableSource({ X: '1' })));
        Envapter.envPaths = resolve(import.meta.dirname, '.env.041-merge');
        Envapter.load();

        expect(process.env.FROM_FILE).to.equal('file');
    });

    it('lifts the .env cascade above every member when envFileOptions.override is true', () => {
        Envapter.envFileOptions = { override: true };
        Envapter.useSource(merge(new FileSource(), new PortableSource({ SHARED: 'secret' })));
        Envapter.envPaths = resolve(import.meta.dirname, '.env.041-merge');

        expect(Envapter.get('SHARED')).to.equal('file');
    });

    it('a file-less merge never writes to process.env even with syncProcessEnv on', () => {
        Envapter.syncProcessEnv = true;
        Envapter.useSource(merge(new PortableSource({ ONLY_A: 'a' }), new PortableSource({ ONLY_B: 'b' })));
        Envapter.load();

        expect(process.env.ONLY_A).to.equal(undefined);
        expect(process.env.ONLY_B).to.equal(undefined);
    });

    it('mirrors only the .env delta, never an overlay member, when syncProcessEnv is on', () => {
        Envapter.syncProcessEnv = true;
        Envapter.useSource(merge(new FileSource(), new PortableSource({ SECRET: 'shh' })));
        Envapter.envPaths = resolve(import.meta.dirname, '.env.041-merge');
        Envapter.load();

        expect(process.env.FROM_FILE).to.equal('file');
        expect(process.env.SECRET).to.equal(undefined);
    });

    it('counts a nested single-file merge as a file member, so a second file member throws', () => {
        expect(() => merge(merge(new FileSource()), new FileSource()))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidMergedSource);
    });

    it('counts the same file-source instance passed twice as two file members', () => {
        const fs = new FileSource();
        expect(() => merge(fs, fs))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidMergedSource);
    });

    it('returns a fresh record per readVars call, so mutating one read does not leak into the next', () => {
        const source = merge(new PortableSource({ K: 'v' }));
        source.readVars().K = 'mutated';

        expect(source.readVars().K).to.equal('v');
    });

    it('coerces each member through its own source, so non-string values become strings', () => {
        Envapter.useSource(merge(new PortableSource({ N: 1 }), new PortableSource({ B: true })));

        expect(Envapter.get('N')).to.equal('1');
        expect(Envapter.get('B')).to.equal('true');
    });

    it('keeps a null member value as "null" and drops an undefined so it never clears the key', () => {
        Envapter.useSource(merge(new PortableSource({ K: null }), new PortableSource({ K: undefined })));

        expect(Envapter.get('K')).to.equal('null');
    });

    it('a later empty-string value wins in the merge', () => {
        Envapter.useSource(merge(new PortableSource({ K: 'value' }), new PortableSource({ K: '' })));

        expect(new Envapter().getRaw('K')).to.equal('');
    });

    it('a single member binds equivalently to that source directly', () => {
        Envapter.useSource(merge(new PortableSource({ K: 'v' })));

        expect(Envapter.get('K')).to.equal('v');
        expect(Envapter.get('MISSING')).to.equal(undefined);
    });

    it('a merge that throws leaves the previously bound source intact', () => {
        Envapter.useSource(new PortableSource({ KEEP: 'yes' }));
        expect(() => merge(new FileSource(), new FileSource())).to.throw(EnvaptError);

        expect(Envapter.get('KEEP')).to.equal('yes');
    });

    it('delegates the file APIs to a custom FileCapableSource member', () => {
        const customFile: FileCapableSource = {
            supportsFiles: true,
            readVars: () => ({ FROM_CUSTOM_VARS: 'vars' }),
            readFile: () => 'FROM_CUSTOM_FILE=filecontent\n',
            resolvePath: (_baseDir, candidate) => candidate,
            normalizeBaseDir: (value) => String(value),
            writeVars: () => {}
        };
        Envapter.useSource(merge(customFile, new PortableSource({ X: '1' })));
        Envapter.envPaths = ['anything.env'];

        expect(Envapter.get('FROM_CUSTOM_VARS')).to.equal('vars');
        expect(Envapter.get('FROM_CUSTOM_FILE')).to.equal('filecontent');
    });

    it('loads the .env cascade through a nested single-file merge', () => {
        Envapter.useSource(merge(merge(new FileSource()), new PortableSource({ X: '1' })));
        Envapter.envPaths = resolve(import.meta.dirname, '.env.041-merge');

        expect(Envapter.get('FROM_FILE')).to.equal('file');
    });
});
