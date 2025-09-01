import { resolve } from 'node:path';

import { expect } from 'chai';
import { it, describe, beforeAll } from 'vitest';

import { Envapt, Envapter } from '../src';

describe('User-defined errors', () => {
  beforeAll(() => (Envapter.envPaths = resolve(`${import.meta.dirname}/.env.user-defined-errors`)));

  describe('custom converter error handling', () => {
    class TestCustomErrors {
      // Static property with custom converter that throws error for missing env var
      @Envapt<string>('SECRET_TOKEN', {
        converter(raw, _fallback) {
          if (typeof raw !== 'string' || raw === '') {
            throw new Error('Missing SECRET_TOKEN');
          }
          return raw;
        }
      })
      public static readonly secretToken: string;

      // Static property with custom converter but no fallback - should call converter with undefined
      @Envapt<string>('REQUIRED_CONFIG', {
        converter(raw) {
          if (typeof raw !== 'string') {
            throw new Error('REQUIRED_CONFIG is required');
          }
          return raw;
        }
      })
      public static readonly requiredConfig: string;

      // Instance property with custom converter that throws error
      @Envapt<string>('MISSING_INSTANCE_VAR', {
        converter(raw, _fallback) {
          if (typeof raw !== 'string' || raw === '') {
            throw new Error('Missing MISSING_INSTANCE_VAR');
          }
          return raw;
        }
      })
      declare public readonly missingInstanceVar: string;

      // Instance property with custom converter but no fallback
      @Envapt<string>('MISSING_REQUIRED_INSTANCE', {
        converter(raw) {
          if (typeof raw !== 'string') {
            throw new Error('MISSING_REQUIRED_INSTANCE is required');
          }
          return raw;
        }
      })
      declare public readonly missingRequiredInstance: string;

      // should work fine with existing env var
      @Envapt<string>('API_KEY', {
        converter(raw, _fallback) {
          if (typeof raw !== 'string') {
            throw new Error('Missing API_KEY');
          }
          return raw;
        }
      })
      public static readonly apiKey: string;
    }

    it('should throw error for static property with fallback when env var is missing', () => {
      // With the updated Parser, custom converters are now called even when fallbacks are provided
      expect(() => TestCustomErrors.secretToken).to.throw('Missing SECRET_TOKEN');
    });

    it('should throw error for static property without fallback when env var is missing', () => {
      // This should call the converter with undefined since no fallback is provided
      expect(() => TestCustomErrors.requiredConfig).to.throw('REQUIRED_CONFIG is required');
    });

    it('should throw error for instance property with fallback when env var is missing', () => {
      const instance = new TestCustomErrors();
      // With the updated Parser, custom converters are now called even when fallbacks are provided
      expect(() => instance.missingInstanceVar).to.throw('Missing MISSING_INSTANCE_VAR');
    });

    it('should throw error for instance property without fallback when env var is missing', () => {
      const instance = new TestCustomErrors();
      // This should call the converter with undefined since no fallback is provided
      expect(() => instance.missingRequiredInstance).to.throw('MISSING_REQUIRED_INSTANCE is required');
    });

    it('should work correctly when env var exists', () => {
      expect(() => TestCustomErrors.apiKey).to.not.throw();
      expect(TestCustomErrors.apiKey).to.equal('valid_api_key_12345');
    });
  });

  describe('updated behavior', () => {
    it('should call custom converters even with fallbacks', () => {
      class UpdatedBehaviorTest {
        @Envapt<string>('NONEXISTENT_VAR', {
          fallback: 'default_value',
          converter(_raw, _fallback) {
            throw new Error('This should now be thrown');
          }
        })
        public static readonly testVar: string;
      }

      // The converter is now called, so the error is thrown
      expect(() => UpdatedBehaviorTest.testVar).to.throw('This should now be thrown');
    });
  });
});
