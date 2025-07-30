import { resolve } from 'node:path';

import { expect } from 'chai';

import { Envapt } from '../src/Envapt';
import { Envapter } from '../src/Envapter';

describe('Instance Properties with @Envapt', () => {
  before(() => (Envapter.envPaths = resolve(__dirname, '.env.instance-props-test')));

  describe('basic instance properties', () => {
    class BasicInstanceProperties {
      @Envapt('INSTANCE_PROP_1') declare instanceProp1: string;

      @Envapt('INSTANCE_PROP_2') declare instanceProp2: string;

      @Envapt('INSTANCE_PROP_3_TEMPLATED', { fallback: 'default3' })
      declare instanceProp3: string;
    }

    const instance = new BasicInstanceProperties();

    it('should have correct instance property values', () => {
      expect(instance.instanceProp1).to.equal('value1');
      expect(instance.instanceProp2).to.equal('value2');
    });

    it('should resolve templated instance property', () => {
      expect(instance.instanceProp3).to.equal('value1-value2');
    });
  });

  describe('type conversion on instance properties', () => {
    class TypeConversionInstance {
      @Envapt('INSTANCE_NUMBER', { converter: 'number', fallback: 0 })
      declare readonly numberProp: number;

      @Envapt('INSTANCE_FLOAT', { converter: 'float', fallback: 0.0 })
      declare readonly floatProp: number;

      @Envapt('INSTANCE_INTEGER', { converter: 'integer', fallback: 0 })
      declare readonly integerProp: number;

      @Envapt('INSTANCE_BOOLEAN_TRUE', { converter: 'boolean', fallback: false })
      declare readonly booleanTrueProp: boolean;

      @Envapt('INSTANCE_BOOLEAN_FALSE', { converter: 'boolean', fallback: true })
      declare readonly booleanFalseProp: boolean;

      @Envapt('INSTANCE_BIGINT', { converter: 'bigint', fallback: 0n })
      declare readonly bigintProp: bigint;
    }

    const instance = new TypeConversionInstance();

    it('should convert number types correctly', () => {
      expect(instance.numberProp).to.equal(42);
      expect(instance.floatProp).to.equal(3.14159);
      expect(instance.integerProp).to.equal(100);
    });

    it('should convert boolean types correctly', () => {
      expect(instance.booleanTrueProp).to.be.true;
      expect(instance.booleanFalseProp).to.be.false;
    });

    it('should convert bigint types correctly', () => {
      expect(instance.bigintProp).to.equal(123456789012345678901234567890n);
    });
  });

  describe('advanced converters on instance properties', () => {
    class AdvancedConvertersInstance {
      @Envapt('INSTANCE_ARRAY', { converter: 'array', fallback: [] })
      declare readonly arrayProp: string[];

      @Envapt('INSTANCE_JSON', { converter: 'json', fallback: {} })
      declare readonly jsonProp: object;

      @Envapt('INSTANCE_URL', { converter: 'url', fallback: new URL('http://localhost') })
      declare readonly urlProp: URL;
    }

    const instance = new AdvancedConvertersInstance();

    it('should convert array correctly', () => {
      expect(instance.arrayProp).to.deep.equal(['value1', 'value2', 'value3']);
    });

    it('should convert JSON correctly', () => {
      const expected = { name: 'test', version: '1.0.0', features: ['auth', 'api'] };
      expect(instance.jsonProp).to.deep.equal(expected);
    });

    it('should convert URL correctly', () => {
      expect(instance.urlProp).to.be.instanceof(URL);
      expect(instance.urlProp.href).to.equal('https://api.example.com/v1');
    });
  });

  describe('template resolution on instance properties', () => {
    class TemplateResolutionInstance {
      @Envapt('INSTANCE_FULL_URL', { fallback: 'http://localhost/default' })
      declare readonly fullUrl: string;

      @Envapt('INSTANCE_SERVICE_CONFIG', { fallback: 'default-service:8080@dev' })
      declare readonly serviceConfig: string;

      @Envapt('BASE_URL', { fallback: 'http://localhost' })
      declare readonly baseUrl: string;

      @Envapt('API_VERSION', { fallback: 'v1' })
      declare readonly apiVersion: string;
    }

    const instance = new TemplateResolutionInstance();

    it('should resolve simple template variables', () => {
      expect(instance.fullUrl).to.equal('https://api.example.com/v2/users');
    });

    it('should resolve complex template variables', () => {
      expect(instance.serviceConfig).to.equal('user-service:3000@production');
    });

    it('should work with individual template components', () => {
      expect(instance.baseUrl).to.equal('https://api.example.com');
      expect(instance.apiVersion).to.equal('v2');
    });
  });

  describe('fallback handling on instance properties', () => {
    class FallbackInstance {
      @Envapt('INSTANCE_MISSING_STRING', { fallback: 'default-string' })
      declare readonly missingString: string;

      @Envapt('INSTANCE_MISSING_NUMBER', { converter: 'number', fallback: 999 })
      declare readonly missingNumber: number;

      @Envapt('INSTANCE_MISSING_BOOLEAN', { converter: 'boolean', fallback: true })
      declare readonly missingBoolean: boolean;

      @Envapt('INSTANCE_MISSING_ARRAY', { converter: 'array', fallback: ['default1', 'default2'] })
      declare readonly missingArray: string[];
    }

    const instance = new FallbackInstance();

    it('should use fallback for missing string', () => {
      expect(instance.missingString).to.equal('default-string');
    });

    it('should use fallback for missing number', () => {
      expect(instance.missingNumber).to.equal(999);
    });

    it('should use fallback for missing boolean', () => {
      expect(instance.missingBoolean).to.be.true;
    });

    it('should use fallback for missing array', () => {
      expect(instance.missingArray).to.deep.equal(['default1', 'default2']);
    });
  });

  describe('edge cases on instance properties', () => {
    class EdgeCasesInstance {
      @Envapt('INSTANCE_EMPTY_STRING', { fallback: 'not-empty' })
      declare readonly emptyString: string;

      @Envapt('INSTANCE_WHITESPACE_ONLY', { fallback: 'fallback' })
      declare readonly whitespaceOnly: string;

      @Envapt('INSTANCE_SPECIAL_CHARS', { fallback: 'fallback' })
      declare readonly specialChars: string;
    }

    const instance = new EdgeCasesInstance();

    it('should use fallback for empty string (expected behavior)', () => {
      // Empty strings are treated as falsy and use fallback
      expect(instance.emptyString).to.equal('not-empty');
    });

    it('should preserve whitespace-only values', () => {
      expect(instance.whitespaceOnly).to.equal('   ');
    });

    it('should handle special characters correctly', () => {
      expect(instance.specialChars).to.equal('!@#$%^&*()_+-=[]{}|;:,.<>?');
    });
  });

  describe('multiple instances with same class', () => {
    class MultiInstanceTest {
      @Envapt('INSTANCE_PROP_1', { fallback: 'default' })
      declare readonly prop1: string;

      @Envapt('INSTANCE_NUMBER', { converter: 'number', fallback: 0 })
      declare readonly numProp: number;
    }

    it('should work correctly across multiple instances', () => {
      const instance1 = new MultiInstanceTest();
      const instance2 = new MultiInstanceTest();
      const instance3 = new MultiInstanceTest();

      // All instances should have the same values
      expect(instance1.prop1).to.equal('value1');
      expect(instance2.prop1).to.equal('value1');
      expect(instance3.prop1).to.equal('value1');

      expect(instance1.numProp).to.equal(42);
      expect(instance2.numProp).to.equal(42);
      expect(instance3.numProp).to.equal(42);
    });
  });

  describe('inheritance with instance properties', () => {
    class BaseClassWithInstance {
      @Envapt('INSTANCE_PROP_1', { fallback: 'base-default' })
      declare readonly baseProp: string;

      @Envapt('INSTANCE_NUMBER', { converter: 'number', fallback: 0 })
      declare readonly baseNumber: number;
    }

    class DerivedClassWithInstance extends BaseClassWithInstance {
      @Envapt('INSTANCE_PROP_2', { fallback: 'derived-default' })
      declare readonly derivedProp: string;

      @Envapt('INSTANCE_BOOLEAN_TRUE', { converter: 'boolean', fallback: false })
      declare readonly derivedBoolean: boolean;
    }

    const derivedInstance = new DerivedClassWithInstance();

    it('should inherit base class instance properties', () => {
      expect(derivedInstance.baseProp).to.equal('value1');
      expect(derivedInstance.baseNumber).to.equal(42);
    });

    it('should have derived class instance properties', () => {
      expect(derivedInstance.derivedProp).to.equal('value2');
      expect(derivedInstance.derivedBoolean).to.be.true;
    });
  });

  describe('mixed static and instance properties', () => {
    class MixedPropertiesClass {
      @Envapt('INSTANCE_PROP_1', { fallback: 'instance-default' })
      declare readonly instanceProp: string;

      @Envapt('INSTANCE_NUMBER', { converter: 'number', fallback: 0 })
      static readonly staticProp: number;

      @Envapt('INSTANCE_BOOLEAN_TRUE', { converter: 'boolean', fallback: false })
      declare readonly instanceBoolean: boolean;

      @Envapt('INSTANCE_ARRAY', { converter: 'array', fallback: [] })
      static readonly staticArray: string[];
    }

    const instance = new MixedPropertiesClass();

    it('should handle instance properties correctly', () => {
      expect(instance.instanceProp).to.equal('value1');
      expect(instance.instanceBoolean).to.be.true;
    });

    it('should handle static properties correctly', () => {
      expect(MixedPropertiesClass.staticProp).to.equal(42);
      expect(MixedPropertiesClass.staticArray).to.deep.equal(['value1', 'value2', 'value3']);
    });
  });

  describe('performance and caching with instance properties', () => {
    class PerformanceTestInstance {
      @Envapt('INSTANCE_PROP_1', { fallback: 'default' })
      declare readonly prop1: string;

      @Envapt('INSTANCE_PROP_2', { fallback: 'default' })
      declare readonly prop2: string;
    }

    it('should cache property values across multiple accesses', () => {
      const instance = new PerformanceTestInstance();

      // Access properties multiple times
      const firstAccess1 = instance.prop1;
      const firstAccess2 = instance.prop2;
      const secondAccess1 = instance.prop1;
      const secondAccess2 = instance.prop2;

      // Values should be consistent (and internally cached)
      expect(firstAccess1).to.equal(secondAccess1);
      expect(firstAccess2).to.equal(secondAccess2);
      expect(firstAccess1).to.equal('value1');
      expect(firstAccess2).to.equal('value2');
    });
  });
});
