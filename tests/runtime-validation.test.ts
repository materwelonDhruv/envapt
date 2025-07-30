import { expect } from 'chai';

import { EnvaptError, EnvaptErrorCodes } from '../src/Error';
import { Validator } from '../src/Validators';

describe('Runtime Validation', () => {
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
});
