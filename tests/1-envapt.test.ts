import { resolve } from 'node:path';

import { expect } from 'chai';

import { Converters, Envapt, Envapter } from '../src';

describe('Envapt', () => {
  before(() => (Envapter.envPaths = resolve(__dirname, '.env.envapt-test')));

  describe('automatic type detection', () => {
    class TestTypeDetection {
      @Envapt('NONEXISTENT_TEST_VAR', undefined)
      public static readonly testUndefinedVar: string | undefined;

      @Envapt('NONEXISTENT_VAR_WITHOUT_FALLBACK', { converter: String })
      public static readonly nonexistentVarWithoutFallback: string | null;

      @Envapt('NONEXISTENT_VAR_NO_OPTIONS')
      public static readonly nonexistentVarNoOptions: string | null;

      @Envapt('PORT', { fallback: 6956 })
      public static readonly port: number;

      @Envapt('IS_ENABLED', { fallback: false })
      public static readonly isEnabled: boolean;

      @Envapt('URI', { fallback: 'db://localhost:27017/' })
      public static readonly uri: string;

      @Envapt('BIGINT_VAR', 23478n)
      public static readonly bigintVar: bigint;

      @Envapt('SYMBOL_VAR', Symbol('test'))
      public static readonly symbolVar: symbol;
    }

    it('should detect undefined type for non-existent variables', () => {
      expect(TestTypeDetection.testUndefinedVar).to.be.undefined;
    });

    it('should return null for non-existent variable without fallback but with converter', () => {
      expect(TestTypeDetection.nonexistentVarWithoutFallback).to.be.null;
    });

    it('should return null for non-existent variable without fallback or converter', () => {
      expect(TestTypeDetection.nonexistentVarNoOptions).to.be.null;
    });

    it('should detect number type from fallback', () => {
      const expectedPort = 7777;
      expect(typeof TestTypeDetection.port).to.equal('number');
      expect(TestTypeDetection.port).to.equal(expectedPort);
    });

    it('should detect boolean type from fallback', () => {
      expect(typeof TestTypeDetection.isEnabled).to.equal('boolean');
      expect(TestTypeDetection.isEnabled).to.be.true;
    });

    it('should detect string type from fallback', () => {
      expect(typeof TestTypeDetection.uri).to.equal('string');
      expect(TestTypeDetection.uri).to.equal('mongodb://localhost:27017/');
    });

    it('should detect bigint type from fallback', () => {
      expect(typeof TestTypeDetection.bigintVar).to.equal('bigint');
      expect(TestTypeDetection.bigintVar).to.equal(99999n);
    });

    it('should detect symbol type from fallback', () => {
      expect(typeof TestTypeDetection.symbolVar).to.equal('symbol');
      expect(TestTypeDetection.symbolVar.toString()).to.equal('Symbol(lmao)');
    });
  });

  describe('explicit overrides and other tests', () => {
    class TestEnv extends Envapter {
      // @ts-expect-error Inconsistent fallback type
      @Envapt('TEST_NUMBER_AS_STRING', { fallback: 42, converter: String })
      public static readonly testNumberAsString: string;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('TEST_STRING_AS_NUMBER', { fallback: '100', converter: Number })
      public static readonly testStringAsNumber: number;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('TEST_STRING_AS_BOOLEAN', { fallback: 'true', converter: Boolean })
      public static readonly testStringAsBoolean: boolean;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('TEST_NUMBER_AS_BIGINT', { fallback: 123456789, converter: BigInt })
      public static readonly testNumberAsBigInt: bigint;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('TEST_STRING_AS_BIGINT', { fallback: '987654321', converter: BigInt })
      public static readonly testStringAsBigInt: bigint;

      // @ts-expect-error Inconsistent fallback type
      @Envapt('TEST_STRING_AS_SYMBOL', { fallback: 'test-symbol', converter: Symbol })
      public static readonly testStringAsSymbol: symbol;

      @Envapt('TEST_VAR', { fallback: undefined })
      public static readonly testVar: string;

      @Envapt('NONEXISTENT_VAR_WITH_FALLBACK_STRING', { fallback: 'default-value' })
      public static readonly nonexistentVarWithFallbackString: string;

      @Envapt('NONEXISTENT_VAR_WITH_FALLBACK_NUMBER', { fallback: 12345 })
      public static readonly nonexistentVarWithFallbackNumber: number;

      @Envapt('NONEXISTENT_VAR_WITH_FALLBACK_BOOLEAN', { fallback: true })
      public static readonly nonexistentVarWithFallbackBoolean: boolean;
    }

    it('should use String converter override despite number fallback', () => {
      expect(typeof TestEnv.testNumberAsString).to.equal('string');
      expect(TestEnv.testNumberAsString).to.equal('42');
    });

    it('should use Number converter override despite string fallback', () => {
      expect(typeof TestEnv.testStringAsNumber).to.equal('number');
      expect(TestEnv.testStringAsNumber).to.equal(100);
    });

    it('should use Boolean converter override despite string fallback', () => {
      expect(typeof TestEnv.testStringAsBoolean).to.equal('boolean');
      expect(TestEnv.testStringAsBoolean).to.be.true;
    });

    it('should use BigInt converter override with number fallback', () => {
      expect(typeof TestEnv.testNumberAsBigInt).to.equal('bigint');
      expect(TestEnv.testNumberAsBigInt).to.equal(123456789n);
    });

    it('should use BigInt converter override with string fallback', () => {
      expect(typeof TestEnv.testStringAsBigInt).to.equal('bigint');
      expect(TestEnv.testStringAsBigInt).to.equal(987654321n);
    });

    it('should use Symbol converter override with string fallback', () => {
      expect(typeof TestEnv.testStringAsSymbol).to.equal('symbol');
      expect(TestEnv.testStringAsSymbol.toString()).to.equal('Symbol(test-symbol)');
    });

    it('should resolve template variables in environment values', () => {
      // expecting it to combine VAR_1, VAR_2, VAR_3 into TEST_VAR
      expect(TestEnv.testVar).to.equal('var1var2var3');
    });

    it('should return fallback for non-existent variable with non-undefined fallback', () => {
      expect(TestEnv.nonexistentVarWithFallbackString).to.equal('default-value');
    });

    it('should return fallback for non-existent variable with non-undefined number fallback', () => {
      expect(TestEnv.nonexistentVarWithFallbackNumber).to.equal(12345);
    });

    it('should return fallback for non-existent variable with non-undefined boolean fallback', () => {
      expect(TestEnv.nonexistentVarWithFallbackBoolean).to.be.true;
    });
  });

  describe('custom converter functions', () => {
    class TestCustomEnv {
      @Envapt('ALLOWED_CHANNELS', {
        fallback: ['default-channel'],
        converter: (raw, fallback) => {
          if (!raw || raw.trim() === '') return fallback;
          return raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      })
      public static readonly allowedChannels: string[];

      @Envapt('FEATURE_FLAGS', {
        fallback: new Set(['basic']),
        converter: (raw, fallback) => {
          if (!raw || raw.trim() === '') return fallback;
          const flags = raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          return new Set(flags);
        }
      })
      public static readonly featureFlags: Set<string>;

      @Envapt('NONEXISTENT_ARRAY', {
        fallback: ['default1', 'default2'],
        converter: (raw, fallback) => {
          if (!raw || raw.trim() === '') return fallback;
          return raw.split(',').map((s) => s.trim());
        }
      })
      public static readonly nonexistentArray: string[];
    }

    it('should parse comma-separated string to array', () => {
      expect(TestCustomEnv.allowedChannels).to.be.an('array');
      const expectedChannels = ['123456789', '987654321', '555666777'];
      expect(TestCustomEnv.allowedChannels).to.deep.equal(expectedChannels);
    });

    it('should parse comma-separated string to Set', () => {
      expect(TestCustomEnv.featureFlags).to.be.instanceof(Set);
      const expectedFlags = new Set(['auth', 'logging', 'caching', 'webhooks']);
      expect(TestCustomEnv.featureFlags).to.deep.equal(expectedFlags);
    });

    it('should use fallback for non-existent variable with custom converter', () => {
      expect(TestCustomEnv.nonexistentArray).to.be.an('array');
      const expectedFallback = ['default1', 'default2'];
      expect(TestCustomEnv.nonexistentArray).to.deep.equal(expectedFallback);
    });
  });

  describe('built-in converters showcase', () => {
    class BuiltInConverterShowcase {
      @Envapt('DATABASE_CONFIG', { converter: Converters.Json })
      static readonly databaseConfig: object;

      @Envapt('API_ENDPOINTS', { converter: { delimiter: ';' } })
      static readonly apiEndpoints: string[];

      @Envapt('CORS_ORIGINS', { converter: { delimiter: '|', type: Converters.Url } })
      static readonly corsOrigins: URL[];

      @Envapt('SERVICE_TAGS', { converter: { delimiter: ' ' } })
      static readonly serviceTags: string[];

      @Envapt('ENABLED_FEATURES', { converter: Converters.Boolean })
      static readonly enabledFeatures: boolean;

      @Envapt('API_TIMEOUT', { converter: Converters.Integer })
      static readonly apiTimeout: number;
    }

    it('should parse JSON configuration', () => {
      expect(BuiltInConverterShowcase.databaseConfig).to.deep.equal({
        host: 'localhost',
        port: 5432,
        ssl: true
      });
    });

    it('should parse semicolon-delimited arrays', () => {
      expect(BuiltInConverterShowcase.apiEndpoints).to.deep.equal(['auth', 'users', 'products', 'orders']);
    });

    it('should parse pipe-delimited URL arrays', () => {
      expect(BuiltInConverterShowcase.corsOrigins).to.be.an('array');
      expect(BuiltInConverterShowcase.corsOrigins.length).to.equal(3);

      expect(BuiltInConverterShowcase.corsOrigins[0]).to.be.instanceOf(URL);
      expect(BuiltInConverterShowcase.corsOrigins[1]).to.be.instanceOf(URL);
      expect(BuiltInConverterShowcase.corsOrigins[2]).to.be.instanceOf(URL);

      expect(BuiltInConverterShowcase.corsOrigins[0]?.href).to.equal('http://localhost:3000/');
      expect(BuiltInConverterShowcase.corsOrigins[1]?.href).to.equal('https://app.example.com/');
      expect(BuiltInConverterShowcase.corsOrigins[2]?.href).to.equal('https://staging.example.com/');
    });

    it('should parse space-delimited arrays', () => {
      expect(BuiltInConverterShowcase.serviceTags).to.deep.equal(['frontend', 'backend', 'api', 'database']);
    });

    it('should parse boolean values', () => {
      expect(BuiltInConverterShowcase.enabledFeatures).to.be.true;
    });

    it('should parse integer values', () => {
      expect(BuiltInConverterShowcase.apiTimeout).to.equal(5000);
    });
  });

  describe('multi-line variables', () => {
    class MultiLineEnv {
      @Envapt('MULTI_LINE_VAR')
      public static readonly multiLineVar: string;

      @Envapt('MULTI_LINE_VAR_ESCAPED')
      public static readonly multiLineVarEscaped: string;

      @Envapt('MULTI_LINE_WITH_BACKSLASHN')
      public static readonly multiLineWithBackslashN: string;

      @Envapt('MULTI_LINE_NUMBER', { converter: Converters.Number })
      public static readonly multiLineNumber: number;
    }

    it('should handle multi-line variables correctly', () => {
      expect(MultiLineEnv.multiLineVar).to.equal('This is a\nvariable that spans\nmultiple lines.');
    });

    it('should handle escaped multi-line variables correctly', () => {
      expect(MultiLineEnv.multiLineVarEscaped).to.equal(
        'This is a \\\nvariable that spans \\\nmultiple lines with \\\nescaping.'
      );
    });

    it('should handle multi-line variables with backslash-n correctly', () => {
      expect(MultiLineEnv.multiLineWithBackslashN).to.equal('This is a\nvariable with a backslash and n.');
    });

    it('should only allow strings in multiline', () => {
      expect(MultiLineEnv.multiLineNumber).to.be.null;
    });
  });

  describe('configuration management', () => {
    describe('dotenvConfig', () => {
      const originalConfig = Envapter.dotenvConfig;

      it('should get default dotenvConfig', () => {
        const config = Envapter.dotenvConfig;
        expect(config).to.deep.equal({ quiet: true });
      });

      it('should set and get valid dotenvConfig', () => {
        const newConfig = { quiet: false, debug: true, override: true };
        Envapter.dotenvConfig = newConfig;
        expect(Envapter.dotenvConfig).to.deep.equal(newConfig);
      });

      it('should set encoding option', () => {
        const configWithEncoding = { encoding: 'latin1' as const };
        Envapter.dotenvConfig = configWithEncoding;
        expect(Envapter.dotenvConfig).to.deep.equal(configWithEncoding);
      });

      it('should set DOTENV_KEY option', () => {
        const configWithKey = { DOTENV_KEY: 'test-key-123' };
        Envapter.dotenvConfig = configWithKey;
        expect(Envapter.dotenvConfig).to.deep.equal(configWithKey);
      });

      afterEach(() => {
        // Reset to original config after each test
        Envapter.dotenvConfig = originalConfig;
      });
    });

    describe('envPaths', () => {
      const testPath = resolve(__dirname, '.env.envapt-test');

      it('should get default envPaths', () => {
        // Default should be ['.env'] but we can't test it because .env doesn't exist
        // So we just test that envPaths getter works
        const currentPaths = Envapter.envPaths;
        expect(currentPaths).to.be.an('array');
        expect(currentPaths.length).to.be.greaterThan(0);
      });

      it('should set single env file path', () => {
        Envapter.envPaths = testPath;
        expect(Envapter.envPaths).to.deep.equal([testPath]);
      });

      it('should set multiple env file paths', () => {
        const paths = [testPath, testPath]; // Using same file twice for testing
        Envapter.envPaths = paths;
        expect(Envapter.envPaths).to.deep.equal(paths);
      });

      afterEach(() => {
        Envapter.envPaths = testPath;
      });
    });
  });
});
