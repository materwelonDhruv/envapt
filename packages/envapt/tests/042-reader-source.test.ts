import { afterEach, describe, expect, it } from 'vitest';

import { Converters, Environment, Envapter, FileSource, merge, PortableSource } from '../src';

describe('a reader source reads one key at a time', () => {
    afterEach(() => {
        Envapter.useSource(new FileSource());
        Envapter.baseDir = undefined;
        Envapter.resetProfiles();
    });

    it('binds a reader function and reads a key through it', () => {
        Envapter.useSource((key) => (key === 'PORT' ? '8080' : undefined));

        expect(Envapter.getNumber('PORT')).to.equal(8080);
    });

    it('reads each key once and negative-caches a miss', () => {
        const calls: string[] = [];
        Envapter.useSource((key) => {
            calls.push(key);
            return key === 'HIT' ? 'yes' : undefined;
        });

        expect(Envapter.get('HIT')).to.equal('yes');
        expect(Envapter.get('HIT')).to.equal('yes');
        expect(Envapter.get('MISS', 'fallback')).to.equal('fallback');
        expect(Envapter.get('MISS', 'fallback')).to.equal('fallback');

        expect(calls).to.deep.equal(['HIT', 'MISS']);
    });

    it('reads a required value through a reader', () => {
        Envapter.useSource((key) => (key === 'ORIGIN_URL' ? 'https://origin.test' : undefined));

        expect(Envapter.getRequired('ORIGIN_URL', Converters.Url).href).to.equal('https://origin.test/');
    });

    it('detects the environment from a reader', () => {
        Envapter.useSource((key) => (key === 'NODE_ENV' ? 'production' : undefined));

        expect(Envapter.environment).to.equal(Environment.Production);
    });

    it('fills a gap from a reader member of a merge, and the snapshot beats the reader for a shared key', () => {
        Envapter.useSource(
            merge(new PortableSource({ SHARED: 'snapshot' }), (key) =>
                key === 'SHARED' ? 'reader' : key === 'READER_ONLY' ? 'from-reader' : undefined
            )
        );

        expect(Envapter.get('SHARED')).to.equal('snapshot');
        expect(Envapter.get('READER_ONLY')).to.equal('from-reader');
    });

    it('picks the last reader that answers among several reader members', () => {
        Envapter.useSource(
            merge(
                (key) => (key === 'SHARED' ? 'first' : key === 'ONLY_A' ? 'a' : undefined),
                (key) => (key === 'SHARED' ? 'second' : key === 'ONLY_B' ? 'b' : undefined)
            )
        );

        expect(Envapter.get('SHARED')).to.equal('second');
        expect(Envapter.get('ONLY_A')).to.equal('a');
        expect(Envapter.get('ONLY_B')).to.equal('b');
    });

    it('selects the cascade environment from a reader member of a file merge', () => {
        Envapter.useSource(merge(new FileSource(), (key) => (key === 'ENVIRONMENT' ? 'production' : undefined)));
        Envapter.baseDir = import.meta.dirname;
        Envapter.configureProfiles({ [Environment.Production]: { paths: '.env.042-prod' } });

        expect(Envapter.get('READER_CASCADE_FOO')).to.equal('prod');
    });
});
