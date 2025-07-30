import { resolve } from 'node:path';

import { expect } from 'chai';

import { Envapt } from '../src/Envapt';
import { Envapter } from '../src/Envapter';

describe('BigInt and Symbol Support', () => {
  before(() => (Envapter.envPaths = resolve(__dirname, '.env.bigint-symbol-test')));

  describe('BigInt support', () => {
    class BigIntTest {
      @Envapt('TEST_BIGINT', { converter: 'bigint', fallback: 0n })
      static readonly testBigint: bigint;

      @Envapt('TEST_BIGINT_LARGE', { converter: 'bigint', fallback: 0n })
      static readonly testBigintLarge: bigint;

      @Envapt('NONEXISTENT_BIGINT', { converter: 'bigint', fallback: 999n })
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

  describe('Symbol support', () => {
    class SymbolTest {
      @Envapt('TEST_SYMBOL', { converter: 'symbol', fallback: Symbol('default') })
      static readonly testSymbol: symbol;

      @Envapt('TEST_SYMBOL_EMPTY', { converter: 'symbol', fallback: Symbol('empty') })
      static readonly testSymbolEmpty: symbol;

      @Envapt('NONEXISTENT_SYMBOL', { converter: 'symbol', fallback: Symbol('fallback') })
      static readonly nonexistentSymbol: symbol;
    }

    it('should handle symbol converter with @Envapt decorator', () => {
      expect(SymbolTest.testSymbol).to.be.a('symbol');
      expect(SymbolTest.testSymbol.description).to.equal('test-symbol');
    });

    it('should handle empty symbol values', () => {
      expect(SymbolTest.testSymbolEmpty).to.be.a('symbol');
      expect(SymbolTest.testSymbolEmpty.description).to.equal('empty');
    });

    it('should use fallback for nonexistent symbol', () => {
      expect(SymbolTest.nonexistentSymbol).to.be.a('symbol');
      expect(SymbolTest.nonexistentSymbol.description).to.equal('fallback');
    });

    it('should work with static getSymbol method', () => {
      const result = Envapter.getSymbol('TEST_SYMBOL', Symbol('default'));
      expect(result).to.be.a('symbol');
      expect(result.description).to.equal('test-symbol');
    });

    it('should work with instance getSymbol method', () => {
      const env = new Envapter();
      const result = env.getSymbol('TEST_SYMBOL', Symbol('default'));
      expect(result).to.be.a('symbol');
      expect(result.description).to.equal('test-symbol');
    });

    it('should return fallback for nonexistent symbol', () => {
      const fallbackSymbol = Symbol('fallback');
      const result = Envapter.getSymbol('NONEXISTENT_SYMBOL_METHOD', fallbackSymbol);
      expect(result).to.equal(fallbackSymbol);
    });
  });
});
