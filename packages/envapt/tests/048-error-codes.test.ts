import { describe, expect, it } from 'vitest';

import { EnvaptErrorCodes } from '../src';

describe('EnvaptErrorCodes (v9)', () => {
    it('holds only numeric codes', () => {
        expect(Object.values(EnvaptErrorCodes).every((code) => typeof code === 'number')).to.equal(true);
    });
});
