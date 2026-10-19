import { resolve } from 'node:path';

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter, Environment } from '../src';
import { Envapt } from '../src/legacy';

describe('Envapter', () => {
    beforeAll(() => {
        Envapter.envPaths = [
            resolve(`${import.meta.dirname}/.env.envapter-test`),
            resolve(`${import.meta.dirname}/.env.extra`)
        ];
    });

    it('detects the environment from a later file in envPaths', () => {
        expect(Envapter.isStaging).to.be.true;
        expect(Envapter.environment).to.equal(Environment.Staging);
    });

    describe('accessors and multiple files', () => {
        class TestEnvapter extends Envapter {
            @Envapt('VAR_IN_EXTRA_FILE', { converter: Converters.Boolean })
            public static readonly varInExtraFile: boolean | undefined;
        }

        it('should load variable from .env.extra file', () => {
            expect(TestEnvapter.varInExtraFile).to.be.true;
        });

        it('reads through the static readers a subclass inherits', () => {
            expect(TestEnvapter.get('GETTER_STRING')).to.equal('primitiveString');
        });
    });

    describe('ordered key lists', () => {
        it('should resolve the first available key for static getters', () => {
            expect(Envapter.get(['MISSING_STRING', 'GETTER_STRING'])).to.equal('primitiveString');
        });

        it('should fall through a present-but-empty key to the next in the list', () => {
            expect(Envapter.get(['EMPTY_ORDERED', 'GETTER_STRING'])).to.equal('primitiveString');
            expect(Envapter.getRequired(['EMPTY_ORDERED', 'GETTER_STRING'], Converters.String)).to.equal(
                'primitiveString'
            );
        });
    });

    describe('envFileOptions', () => {
        afterEach(() => {
            Envapter.envFileOptions = {};
        });

        it('defaults to an empty object', () => {
            expect(Envapter.envFileOptions).to.deep.equal({});
        });

        it('returns the options that were set', () => {
            Envapter.envFileOptions = { override: true, encoding: 'latin1' };
            expect(Envapter.envFileOptions).to.deep.equal({ override: true, encoding: 'latin1' });
        });
    });
});
