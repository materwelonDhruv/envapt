import { resolve } from 'node:path';

import { expect } from 'chai';

import { Envapt } from '../src/Envapt';
import { Envapter } from '../src/Envapter';

describe('Edge Cases', () => {
  before(() => (Envapter.envPaths = resolve(__dirname, '.env.edge-cases')));

  describe('Number conversion edge cases', () => {
    class NumberEdgeCases {
      @Envapt('ZERO_VALUE', { converter: Number })
      static readonly zero: number;

      @Envapt('NEGATIVE_ZERO', { converter: Number })
      static readonly negativeZero: number;

      @Envapt('INFINITY_VALUE', { converter: Number })
      static readonly infinity: number;

      @Envapt('NEGATIVE_INFINITY', { converter: Number })
      static readonly negativeInfinity: number;

      @Envapt('EPSILON_VALUE', { converter: Number })
      static readonly epsilon: number;
    }

    it('should handle zero correctly', () => {
      expect(NumberEdgeCases.zero).to.equal(0);
    });

    it('should handle negative zero correctly', () => {
      expect(NumberEdgeCases.negativeZero).to.equal(0);
    });

    it('should handle infinity', () => {
      expect(NumberEdgeCases.infinity).to.equal(Number.POSITIVE_INFINITY);
    });

    it('should handle negative infinity', () => {
      expect(NumberEdgeCases.negativeInfinity).to.equal(Number.NEGATIVE_INFINITY);
    });

    it('should handle scientific number', () => {
      expect(NumberEdgeCases.epsilon).to.equal(Number.EPSILON);
    });
  });

  describe('Boolean conversion edge cases', () => {
    class BooleanEdgeCases {
      @Envapt('UPPERCASE_TRUE', { fallback: false })
      static readonly uppercaseTrue: boolean;

      @Envapt('MIXED_CASE_FALSE', { fallback: true })
      static readonly mixedCaseFalse: boolean;

      @Envapt('NUMERIC_BOOL', { fallback: false })
      static readonly numericBool: boolean;
    }

    it('should handle uppercase boolean values', () => {
      expect(BooleanEdgeCases.uppercaseTrue).to.be.true;
    });

    it('should handle mixed case boolean values', () => {
      expect(BooleanEdgeCases.mixedCaseFalse).to.be.false;
    });

    it('should handle numeric boolean values', () => {
      expect(BooleanEdgeCases.numericBool).to.be.true;
    });
  });

  describe('Template resolution edge cases', () => {
    class TemplateEdgeCases {
      @Envapt('NONEXISTENT_TEMPLATE')
      static readonly nonexistentTemplate: string;

      @Envapt('EMPTY_TEMPLATE')
      static readonly emptyTemplate: string;

      @Envapt('CIRCULAR_TEMPLATE')
      static readonly circularTemplate: string;

      @Envapt('CIRCULAR_A')
      static readonly circularA: string;

      @Envapt('CIRCULAR_B')
      static readonly circularB: string;

      @Envapt('MULTI_TYPE_TEMPLATE')
      static readonly multiTypeTemplate: string;
    }

    it('should handle nonexistent template variables', () => {
      expect(TemplateEdgeCases.nonexistentTemplate).to.equal('${DOES_NOT_EXIST}');
    });

    it('should preserve template syntax for empty variables', () => {
      expect(TemplateEdgeCases.emptyTemplate).to.equal('${EMPTY_VAR}');
    });

    it('should handle circular template variables', () => {
      expect(TemplateEdgeCases.circularTemplate).to.equal('${CIRCULAR_TEMPLATE}');
    });

    it('should handle circular references between variables', () => {
      expect(TemplateEdgeCases.circularA).to.equal('${CIRCULAR_B}');
      expect(TemplateEdgeCases.circularB).to.equal('${CIRCULAR_A}');
    });

    it('should resolve multi-type template variables correctly', () => {
      expect(TemplateEdgeCases.multiTypeTemplate).to.equal('stringVar123true');
      expect(typeof TemplateEdgeCases.multiTypeTemplate).to.equal('string');
    });
  });

  describe('Type coercion edge cases', () => {
    class TypeCoercionEdgeCases {
      @Envapt('STRING_TO_NUMBER', { fallback: Number.NaN, converter: Number })
      static readonly stringToNumber: number;

      @Envapt('OBJECT_FALLBACK', {
        fallback: { key: 'default' },
        converter: (raw, fallback) => {
          if (typeof raw !== 'string' || !fallback) return fallback;
          return JSON.parse(raw);
        }
      })
      static readonly objectFallback: object;
    }

    it('should handle invalid number conversions', () => {
      const result = TypeCoercionEdgeCases.stringToNumber;
      expect(typeof result).to.equal('number');
      expect(Number.isNaN(result)).to.be.true;
    });

    it('should handle object fallback', () => {
      const result = TypeCoercionEdgeCases.objectFallback;
      expect(result).to.deep.equal({ key: 'default' });
    });
  });

  describe('Extreme values', () => {
    class ExtremeValues {
      @Envapt('UNICODE_VALUE', { fallback: 'ascii' })
      static readonly unicodeValue: string;

      @Envapt('VERY_LONG_STRING', { fallback: 'short' })
      static readonly veryLongString: string;
    }

    it('should handle very long environment values', () => {
      const longValue = 'x'.repeat(5000);
      expect(ExtremeValues.veryLongString).to.equal(longValue);
    });

    it('should handle unicode characters', () => {
      expect(ExtremeValues.unicodeValue).to.equal('🚀 Hello 世界 🌍');
    });
  });
});
