import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter } from '../src';
import { Envapt } from '../src/legacy';

describe('BigInt Support', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.bigint-test')));

    describe('BigInt support', () => {
        class BigIntTest {
            @Envapt('TEST_BIGINT', { converter: Converters.Bigint, fallback: 0n })
            static readonly testBigint: bigint;

            @Envapt('TEST_BIGINT_LARGE', { converter: BigInt, fallback: 0n })
            static readonly testBigintLarge: bigint;

            @Envapt('NONEXISTENT_BIGINT', { converter: Converters.Bigint, fallback: 999n })
            static readonly nonexistentBigint: bigint;
        }

        it('should handle bigint converter with @Envapt decorator', () => {
            expect(BigIntTest.testBigint).to.equal(123456789012345678901234567890n);
        });

        it('should handle large bigint values', () => {
            expect(BigIntTest.testBigintLarge).to.equal(999999999999999999999999999999999999999999999999999999999999n);
        });

        it('should use fallback for nonexistent bigint', () => {
            expect(BigIntTest.nonexistentBigint).to.equal(999n);
        });

        it('should work with static getBigInt method', () => {
            const result = Envapter.getBigInt('TEST_BIGINT', 0n);
            expect(result).to.equal(123456789012345678901234567890n);
        });

        it('should work with instance getBigInt method', () => {
            const env = new Envapter();
            const result = env.getBigInt('TEST_BIGINT', 0n);
            expect(result).to.equal(123456789012345678901234567890n);
        });

        it('should return fallback for invalid bigint', () => {
            const result = Envapter.getBigInt('TEST_INVALID_BIGINT', 888n);
            expect(result).to.equal(888n);
        });
    });
});
