import { describe, expect, it } from 'vitest';

import { EnvaptErrorCodes } from '../src';

describe('EnvaptErrorCodes (v9)', () => {
    it('maps each name to its numeric code and holds nothing else', () => {
        const values = Object.values(EnvaptErrorCodes);
        expect(values.every((code) => typeof code === 'number')).to.equal(true);
        expect(EnvaptErrorCodes.InvalidEnvValue).to.equal(210);
    });
});
