import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter } from '../src';

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
});
