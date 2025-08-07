import { resolve } from "node:path";

import { expect } from 'chai';
import { it, describe, beforeAll, afterEach } from 'vitest';

import { Envapt, Envapter, Environment } from '../src/';
import process from "node:process";

const importMeta = import.meta as { dirname: string }

describe('Envapter', () => {
  beforeAll(() => {
    process.env = {}
    Envapter.envPaths = resolve(importMeta.dirname + '/.env.envapter-test')
  });

  describe('env path configuration and environment type', () => {
    it('should be .env.envapter-test set before tests rather than .env', () => {
      expect(Envapter.envPaths).to.deep.equal([resolve(importMeta.dirname + '/.env.envapter-test')]);
    });

    it('should be true for isDevelopment environment by default', () => {
      expect(Envapter.isDevelopment).to.be.true;
      expect(Envapter.isProduction).to.be.false;
      expect(Envapter.isStaging).to.be.false;
      expect(Envapter.environment).to.equal(Environment.Development);
    });

    it('should allow setting custom .env path', () => {
      // Use existing test file instead of non-existent custom/.env
      const testPath = resolve(importMeta.dirname,  '.env.envapter-test')
      Envapter.envPaths = testPath;
      expect(Envapter.envPaths).to.deep.equal([testPath]);
    });

    // reset to test path
    it('should set to list of .env files', () => {
      Envapter.envPaths = [resolve(importMeta.dirname + '/.env.envapter-test'), resolve(importMeta.dirname + '/.env.extra')];
      expect(Envapter.envPaths).to.deep.equal([
        resolve(importMeta.dirname + '/.env.envapter-test'),
        resolve(importMeta.dirname + '/.env.extra')
      ]);
    });

    it('should be true for isStaging environment set in .env.extra', () => {
      expect(Envapter.isStaging).to.be.true;
      expect(Envapter.isProduction).to.be.false;
      expect(Envapter.isDevelopment).to.be.false;
      expect(Envapter.environment).to.equal(Environment.Staging);
    });

    it('should be true for isProduction environment when set', () => {
      Envapter.environment = Environment.Production;
      expect(Envapter.isStaging).to.be.false;
      expect(Envapter.isProduction).to.be.true;
      expect(Envapter.isDevelopment).to.be.false;
      expect(Envapter.environment).to.equal(Environment.Production);
    });
  });

  describe('accessors and multiple files', () => {
    class TestEnvapter extends Envapter {
      @Envapt('VAR_IN_EXTRA_FILE', { converter: Boolean })
      public static readonly varInExtraFile: boolean | undefined;
    }

    const instance = new TestEnvapter();

    // should work now since we set the extra .env path above
    it('should load variable from .env.extra file', () => {
      expect(TestEnvapter.varInExtraFile).to.be.true;
    });

    it('should find envs for primitive getters using static method', () => {
      expect(TestEnvapter.get('GETTER_STRING')).to.equal('primitiveString');
      expect(TestEnvapter.getNumber('GETTER_NUMBER')).to.equal(12345);
      expect(TestEnvapter.getBoolean('GETTER_BOOLEAN')).to.equal(true);
      expect(TestEnvapter.getBigInt('GETTER_BIGINT')).to.equal(123456789012345678901234567890n);
      expect(TestEnvapter.getSymbol('GETTER_SYMBOL')).to.be.a('symbol');
    });

    it('should find envs for primitive getters using instance method', () => {
      expect(instance.get('GETTER_STRING')).to.equal('primitiveString');
      expect(instance.getNumber('GETTER_NUMBER')).to.equal(12345);
      expect(instance.getBoolean('GETTER_BOOLEAN')).to.equal(true);
      expect(instance.getBigInt('GETTER_BIGINT')).to.equal(123456789012345678901234567890n);
      expect(instance.getSymbol('GETTER_SYMBOL')).to.be.a('symbol');
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
      const testPath = resolve(importMeta.dirname + '/.env.envapt-test');

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
