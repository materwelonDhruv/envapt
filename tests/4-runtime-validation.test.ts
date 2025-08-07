import { resolve } from 'node:path';

import { expect } from 'chai';
import { it, describe, beforeAll } from 'vitest';

import { Converters, Envapt, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/Error';
import { Validator } from '../src/Validators';

import type { JsonValue } from '../src';

const importMeta = import.meta as { dirname: string };

describe('Runtime Validation', () => {
  beforeAll(() => (Envapter.envPaths = resolve(importMeta.dirname, '.env.extra')));

  describe('Built-in converter validation', () => {
    it('should validate correct built-in converter types', () => {
      const validTypes = ['string', 'number', 'boolean', 'bigint', 'symbol', 'array', 'json', 'url', 'regexp', 'date'];

      for (const type of validTypes) {
        const testFunction = (): void => Validator.builtInConverter(type);
        expect(testFunction).to.not.throw();
      }
    });

    it('should throw for invalid built-in converter types', () => {
      const invalidTypes = ['invalid', 'str', 'num'];

      const testFunction = (type: string) => () => Validator.builtInConverter(type);

      invalidTypes.forEach((type) => {
        expect(testFunction(type))
          .to.throw(EnvaptError)
          .with.property('code', EnvaptErrorCodes.InvalidBuiltInConverter);
      });
    });

    it('should throw for non-string types', () => {
      const nonStringTypes = [
        { value: 123, expectedCode: EnvaptErrorCodes.InvalidConverterType },
        { value: {}, expectedCode: EnvaptErrorCodes.InvalidConverterType },
        { value: null, expectedCode: EnvaptErrorCodes.InvalidConverterType }
      ];

      const testFunction = (value: unknown) => () => Validator.builtInConverter(value);

      nonStringTypes.forEach(({ value, expectedCode }) => {
        expect(testFunction(value)).to.throw(EnvaptError).with.property('code', expectedCode);
      });
    });
  });

  describe('ArrayConverter validation', () => {
    it('should validate correct ArrayConverter configurations', () => {
      const validConfigs = [
        { delimiter: ',' },
        { delimiter: ';', type: 'string' },
        { delimiter: '|', type: 'number' },
        { delimiter: ' ', type: 'boolean' }
      ];

      for (const config of validConfigs) {
        const testFunction = (): void => Validator.arrayConverter(config);
        expect(testFunction).to.not.throw();
      }
    });

    it('should throw for invalid ArrayConverter configurations', () => {
      const invalidConfigs = [{}, 'string', null];

      const testFunction = (config: unknown) => () => Validator.arrayConverter(config);

      invalidConfigs.forEach((config) => {
        expect(testFunction(config)).to.throw(EnvaptError).with.property('code', EnvaptErrorCodes.MissingDelimiter);
      });
    });

    it('should throw for invalid ArrayConverter types', () => {
      const invalidTypes = ['array', 'json', 'regexp', 'invalid'];

      const testFunction = (type: string) => () => Validator.arrayConverter({ delimiter: ',', type });

      invalidTypes.forEach((type) => {
        expect(testFunction(type))
          .to.throw(EnvaptError)
          .with.property('code', EnvaptErrorCodes.InvalidArrayConverterType);
      });
    });

    it('should validate correct ArrayConverter element types', () => {
      const validTypes = ['string', 'number', 'boolean', 'integer', 'bigint', 'symbol', 'float', 'url', 'date'];

      for (const type of validTypes) {
        expect(Validator.isValidArrayConverterType(type)).to.be.true;
      }
    });

    it('should reject invalid ArrayConverter element types', () => {
      const invalidTypes = ['array', 'json', 'regexp', 'invalid', 123, {}, null];

      for (const type of invalidTypes) {
        expect(Validator.isValidArrayConverterType(type)).to.be.false;
      }
    });
  });

  describe('Converter fallback validation', () => {
    class FallbackTests {
      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_ARRAY_VAR', {
        converter: { delimiter: ',' },
        fallback: 'not-an-array'
      })
      static readonly invalidArrayFallback: string[];

      // @ts-expect-error Inconsistent fallback type
      @Envapt('INVALID_ARRAY_CONVERTER_TYPE', {
        converter: { delimiter: ',', type: 'invalid' },
        fallback: []
      })
      static readonly invalidArrayConverterType: string[];

      @Envapt('NONEXISTENT_ARRAY_VAR', {
        converter: { delimiter: ',' }
      })
      static readonly noFallbackArray: string[] | null;
    }

    it('should throw error when ArrayConverter is used with non-array fallback for missing env var', () => {
      expect(() => FallbackTests.invalidArrayFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.InvalidFallback);
    });

    it('should throw error when ArrayConverter is used with invalid type in converter', () => {
      expect(() => FallbackTests.invalidArrayConverterType)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.InvalidArrayConverterType);
    });

    it('should return null when ArrayConverter is used without fallback for missing env var', () => {
      expect(FallbackTests.noFallbackArray).to.be.null;
    });
  });

  describe('Custom converter validation', () => {
    class CustomConverterTests {
      // @ts-expect-error Invalid custom converter type
      @Envapt('CUSTOM_CONVERTER_VAR', { converter: 'lol' })
      static readonly customConverter: string;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('CUSTOM_CONVERTER_INCONSISTENT_FALLBACK_TYPE', {
        fallback: 42,
        converter: (_raw, fallback) => String(fallback)
      })
      static readonly customConverterInconsistentFallbackType: string;
    }

    it('should throw on invalid passed converter', () => {
      expect(() => CustomConverterTests.customConverter)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.InvalidCustomConverter);
    });

    it('should not throw on custom converter with consistent fallback type', () => {
      expect(() => CustomConverterTests.customConverterInconsistentFallbackType).to.not.throw();
    });
  });

  describe('Fallback type validation for built-in converters', () => {
    class FallbackTypeValidationTests {
      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_STRING_VAR', { converter: Converters.String, fallback: 42 })
      static readonly stringWithNumberFallback: string;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_NUMBER_VAR', { converter: Converters.Number, fallback: 'not-a-number' })
      static readonly numberWithStringFallback: number;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_BOOLEAN_VAR', { converter: Converters.Boolean, fallback: 'not-a-boolean' })
      static readonly booleanWithStringFallback: boolean;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_BIGINT_VAR', { converter: Converters.Bigint, fallback: 42 })
      static readonly bigintWithNumberFallback: bigint;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_SYMBOL_VAR', { converter: Converters.Symbol, fallback: 'not-a-symbol' })
      static readonly symbolWithStringFallback: symbol;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_URL_VAR', { converter: Converters.Url, fallback: 'not-a-url-object' })
      static readonly urlWithStringFallback: URL;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_REGEXP_VAR', { converter: Converters.Regexp, fallback: 'not-a-regexp-object' })
      static readonly regexpWithStringFallback: RegExp;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_DATE_VAR', { converter: Converters.Date, fallback: 'not-a-date-object' })
      static readonly dateWithStringFallback: Date;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_TIME_VAR', { converter: Converters.Time, fallback: 'not-a-number' })
      static readonly timeWithStringFallback: number;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_JSON_VAR', { converter: Converters.Json, fallback: Symbol('not-a-json') })
      static readonly jsonWithStringFallback: JsonValue;

      // Valid fallbacks for comparison
      @Envapt('NONEXISTENT_STRING_VAR', { converter: Converters.String, fallback: 'valid-string' })
      static readonly stringWithValidFallback: string;

      @Envapt('NONEXISTENT_URL_VAR', { converter: Converters.Url, fallback: new URL('http://example.com') })
      static readonly urlWithValidFallback: URL;
    }

    it('should throw when string converter has non-string fallback', () => {
      expect(() => FallbackTypeValidationTests.stringWithNumberFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when number converter has non-number fallback', () => {
      expect(() => FallbackTypeValidationTests.numberWithStringFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when boolean converter has non-boolean fallback', () => {
      expect(() => FallbackTypeValidationTests.booleanWithStringFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when bigint converter has non-bigint fallback', () => {
      expect(() => FallbackTypeValidationTests.bigintWithNumberFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when symbol converter has non-symbol fallback', () => {
      expect(() => FallbackTypeValidationTests.symbolWithStringFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when URL converter has non-URL fallback', () => {
      expect(() => FallbackTypeValidationTests.urlWithStringFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when RegExp converter has non-RegExp fallback', () => {
      expect(() => FallbackTypeValidationTests.regexpWithStringFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when Date converter has non-Date fallback', () => {
      expect(() => FallbackTypeValidationTests.dateWithStringFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when time converter has non-number fallback', () => {
      expect(() => FallbackTypeValidationTests.timeWithStringFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should throw when JSON converter has non-JSON fallback', () => {
      expect(() => FallbackTypeValidationTests.jsonWithStringFallback)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.FallbackConverterTypeMismatch);
    });

    it('should not throw when converters have matching fallback types', () => {
      expect(() => FallbackTypeValidationTests.stringWithValidFallback).to.not.throw();
      expect(() => FallbackTypeValidationTests.urlWithValidFallback).to.not.throw();
    });
  });

  describe('Array converter fallback element type validation', () => {
    class ArrayConverterValidationTests {
      // Array converter with mixed-type fallback elements
      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_ARRAY_VAR', {
        converter: { delimiter: ',', type: Converters.String },
        fallback: ['string', 42, 'another-string']
      })
      static readonly arrayWithMixedTypeElements: string[];

      // Array converter where type doesn't match fallback element type
      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_ARRAY_VAR', {
        converter: { delimiter: ',', type: Converters.Number },
        fallback: ['not-a-number', 'also-not-a-number']
      })
      static readonly arrayWithWrongElementType: number[];

      // Default 'array' converter with mixed-type fallback elements
      // @ts-expect-error Inconsistent fallback type
      @Envapt('NONEXISTENT_ARRAY_VAR', {
        converter: Converters.Array,
        fallback: ['string', 42, true]
      })
      static readonly defaultArrayWithMixedTypes: string[];

      // Valid array converters for comparison
      @Envapt('NONEXISTENT_ARRAY_VAR', {
        converter: { delimiter: ',', type: Converters.String },
        fallback: ['all', 'strings', 'here']
      })
      static readonly validStringArray: string[];

      @Envapt('NONEXISTENT_ARRAY_VAR', {
        converter: { delimiter: ',', type: Converters.Number },
        fallback: [1, 2, 3]
      })
      static readonly validNumberArray: number[];

      @Envapt('NONEXISTENT_ARRAY_VAR', {
        converter: Converters.Array,
        fallback: ['all', 'strings']
      })
      static readonly validDefaultArray: string[];
    }

    it('should throw when array converter fallback has mixed element types', () => {
      expect(() => ArrayConverterValidationTests.arrayWithMixedTypeElements)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);
    });

    it('should throw when array converter type does not match fallback element type', () => {
      expect(() => ArrayConverterValidationTests.arrayWithWrongElementType)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);
    });

    it('should throw when default array converter fallback has mixed element types', () => {
      expect(() => ArrayConverterValidationTests.defaultArrayWithMixedTypes)
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);
    });

    it('should not throw when array converter fallback elements have consistent and matching types', () => {
      expect(() => ArrayConverterValidationTests.validStringArray).to.not.throw();
      expect(() => ArrayConverterValidationTests.validNumberArray).to.not.throw();
      expect(() => ArrayConverterValidationTests.validDefaultArray).to.not.throw();
    });
  });

  describe('Primitive constructor validation', () => {
    it('should correctly identify primitive constructors', () => {
      expect(Validator.isPrimitiveConstructor(String)).to.be.true;
      expect(Validator.isPrimitiveConstructor(Number)).to.be.true;
      expect(Validator.isPrimitiveConstructor(Boolean)).to.be.true;
      expect(Validator.isPrimitiveConstructor(BigInt)).to.be.true;
      expect(Validator.isPrimitiveConstructor(Symbol)).to.be.true;
    });

    it('should correctly reject non-primitive constructors', () => {
      expect(Validator.isPrimitiveConstructor('string')).to.be.false;
      expect(Validator.isPrimitiveConstructor(42)).to.be.false;
      expect(Validator.isPrimitiveConstructor(Date)).to.be.false;
      expect(Validator.isPrimitiveConstructor(Array)).to.be.false;
      expect(Validator.isPrimitiveConstructor({})).to.be.false;
    });

    it('should return fallback as-is when types already match', () => {
      expect(Validator.coercePrimitiveFallback(String, 'already-string')).to.equal('already-string');
      expect(Validator.coercePrimitiveFallback(Number, 42)).to.equal(42);
      expect(Validator.coercePrimitiveFallback(Boolean, true)).to.equal(true);
      expect(Validator.coercePrimitiveFallback(BigInt, 123n)).to.equal(123n);

      const sym = Symbol('test');
      expect(Validator.coercePrimitiveFallback(Symbol, sym)).to.equal(sym);
    });

    it('should coerce values to correct primitive types', () => {
      expect(Validator.coercePrimitiveFallback(String, 42)).to.equal('42');
      expect(Validator.coercePrimitiveFallback(Number, '42')).to.equal(42);
      expect(Validator.coercePrimitiveFallback(Boolean, 'true')).to.equal(true);
      expect(Validator.coercePrimitiveFallback(Boolean, 0)).to.equal(false);
      expect(Validator.coercePrimitiveFallback(BigInt, '123')).to.equal(123n);
      expect(Validator.coercePrimitiveFallback(BigInt, 456)).to.equal(456n);

      const coercedSymbol = Validator.coercePrimitiveFallback<symbol>(Symbol, 'test-symbol');
      expect(typeof coercedSymbol).to.equal('symbol');
      expect(coercedSymbol.toString()).to.equal('Symbol(test-symbol)');
    });

    it('should throw PrimitiveCoercionFailed when BigInt coercion fails', () => {
      expect(() => Validator.coercePrimitiveFallback(BigInt, {}))
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.PrimitiveCoercionFailed);
    });

    it('should throw PrimitiveCoercionFailed when Symbol coercion fails', () => {
      // Use an object with a toString that throws to cause Symbol constructor to fail
      const problematicObject = {
        toString() {
          throw new Error('Cannot convert to string');
        }
      };
      expect(() => Validator.coercePrimitiveFallback(Symbol, problematicObject))
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.PrimitiveCoercionFailed);
    });
  });

  describe('Array converter element type validation', () => {
    it('should not throw for empty arrays', () => {
      expect(() => Validator.validateArrayConverterElementTypeMatch('string', [])).to.not.throw();
      expect(() => Validator.validateArrayConverterElementTypeMatch('number', [])).to.not.throw();
    });

    it('should not throw when array elements match converter type', () => {
      expect(() => Validator.validateArrayConverterElementTypeMatch('string', ['a', 'b', 'c'])).to.not.throw();
      expect(() => Validator.validateArrayConverterElementTypeMatch('number', [1, 2, 3])).to.not.throw();
      expect(() => Validator.validateArrayConverterElementTypeMatch('boolean', [true, false, true])).to.not.throw();
    });

    it('should throw when array elements do not match converter type', () => {
      expect(() => Validator.validateArrayConverterElementTypeMatch('number', ['not-a-number']))
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);

      expect(() => Validator.validateArrayConverterElementTypeMatch('string', [123]))
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.ArrayFallbackElementTypeMismatch);
    });
  });

  describe('dotenv config validation', () => {
    it('should accept valid dotenv config options', () => {
      const validConfigs = [
        { quiet: true },
        { debug: false },
        { override: true },
        { encoding: 'utf8' },
        { DOTENV_KEY: 'test-key' },
        { quiet: true, debug: false, override: true }
      ];

      for (const config of validConfigs) {
        expect(() => Validator.validateDotenvConfig(config)).to.not.throw();
      }
    });

    it('should throw error for path option', () => {
      expect(() => Validator.validateDotenvConfig({ path: '.env.test' }))
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('should throw error for processEnv option', () => {
      expect(() => Validator.validateDotenvConfig({ processEnv: {} }))
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('should throw error for invalid options', () => {
      expect(() => Validator.validateDotenvConfig({ invalidOption: 'test' }))
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('should throw error for multiple invalid options', () => {
      const error = (() => {
        try {
          Validator.validateDotenvConfig({ invalidOption1: 'test', invalidOption2: 'test' });
          return null;
        } catch (err) {
          return err as EnvaptError;
        }
      })();

      expect(error).to.be.instanceOf(EnvaptError);
      expect(error?.code).to.equal(EnvaptErrorCodes.InvalidUserDefinedConfig);
      expect(error?.message).to.include('invalidOption1, invalidOption2');
    });
  });

  describe('env file validation', () => {
    it('should throw error for non-existent single file', () => {
      expect(() => Validator.validateEnvFilesExist(['/non/existent/file.env']))
        .to.throw(EnvaptError)
        .with.property('code', EnvaptErrorCodes.EnvFilesNotFound);
    });

    it('should throw error for non-existent multiple files', () => {
      const error = (() => {
        try {
          Validator.validateEnvFilesExist(['/non/existent/file1.env', '/non/existent/file2.env']);
          return null;
        } catch (err) {
          return err as EnvaptError;
        }
      })();

      expect(error).to.be.instanceOf(EnvaptError);
      expect(error?.code).to.equal(EnvaptErrorCodes.EnvFilesNotFound);
      expect(error?.message).to.include('/non/existent/file1.env, /non/existent/file2.env');
    });

    it('should not throw error for existing file', () => {
      const testEnvPath = resolve(importMeta.dirname, '.env.envapt-test');
      expect(() => Validator.validateEnvFilesExist([testEnvPath])).to.not.throw();
    });
  });
});
