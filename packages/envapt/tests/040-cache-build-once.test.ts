import { afterEach, describe, expect, it } from 'vitest';

import { Envapter, FileSource } from '../src';

import type { Source } from '../src';

describe('the read cache builds once per bound source', () => {
    afterEach(() => {
        Envapter.useSource(new FileSource());
    });

    it('does not re-read a source that resolves to no keys on every access', () => {
        let reads = 0;
        const source: Source = {
            readVars() {
                reads++;
                return {};
            }
        };
        Envapter.useSource(source);
        // useSource builds the cache once; count only the reads after that point.
        reads = 0;

        Envapter.get('A');
        Envapter.get('B');
        Envapter.get('C');

        expect(reads).to.equal(0);
    });
});
