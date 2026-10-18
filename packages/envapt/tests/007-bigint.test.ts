import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Envapter } from '../src';
import { Envapt } from '../src/legacy';

describe('BigInt Support', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.bigint-test')));

    it('should handle large bigint values', () => {
        class BigIntTest {
            @Envapt('TEST_BIGINT_LARGE', { converter: BigInt, fallback: 0n })
            static readonly testBigintLarge: bigint;
        }
        expect(BigIntTest.testBigintLarge).to.equal(999999999999999999999999999999999999999999999999999999999999n);
    });

    it('should return fallback for invalid bigint', () => {
        expect(Envapter.getBigInt('TEST_INVALID_BIGINT', 888n)).to.equal(888n);
    });
});
