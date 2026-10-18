import { describe, expect, it } from 'vitest';

import { Envapter } from '../src';
import { Envapt } from '../src/legacy';

describe('Missing .env file handling', () => {
    it('reads fallbacks when no .env file exists at the default location', () => {
        class TestEnvWithoutFile {
            @Envapt('NONEXISTENT_VAR', { fallback: 'fallback-value' })
            public static readonly nonexistentVar: string;
        }

        expect(TestEnvWithoutFile.nonexistentVar).to.equal('fallback-value');
        expect(Envapter.getNumber('NONEXISTENT_NUMBER_VAR', 123)).to.equal(123);
    });
});
