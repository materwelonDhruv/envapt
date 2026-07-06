import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter } from '../src';
import { EnvaptError } from '../src/infra/Error';

import type { StandardSchemaV1 } from '../src/infra/StandardSchema';

const echoSchema: StandardSchemaV1<string> = {
    '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value) => ({ value: value as string })
    }
};

describe('missing-value return unification (v8)', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.044')));

    describe('a read with no fallback resolves to undefined', () => {
        it('getUsing returns undefined for a present but unconvertible value', () => {
            expect(Envapter.getUsing('BAD_NUM_044', Converters.Number)).to.be.undefined;
        });

        it('getUsing returns undefined for a missing value', () => {
            expect(Envapter.getUsing('MISSING_044', Converters.Number)).to.be.undefined;
        });
    });

    describe('getWith passes the raw value to the custom converter', () => {
        it('calls the converter with undefined for a missing key', () => {
            const seen: (string | undefined)[] = [];
            const converter = (raw: string | undefined): string => {
                seen.push(raw);
                return raw === undefined ? 'MISSING' : raw.toUpperCase();
            };
            expect(Envapter.getWith('MISSING_044', converter)).to.equal('MISSING');
            expect(seen).to.deep.equal([undefined]);
        });
    });

    describe('an explicit undefined fallback is no fallback', () => {
        it('parse throws when the key is missing and the fallback is an explicit undefined', () => {
            expect(() => Envapter.parse('MISSING_044', echoSchema, undefined)).to.throw(EnvaptError);
        });
    });
});
