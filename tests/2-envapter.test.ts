import { resolve } from 'node:path';

import { expect } from 'chai';

import { Envapt, Envapter, Environment } from '../src';

describe('Envapter', () => {
  before(() => (Envapter.envPaths = resolve(__dirname, '.env.envapter-test')));

  describe('env path configuration and environment type', () => {
    it('should be .env.envapter-test set before tests rather than .env', () => {
      expect(Envapter.envPaths).to.deep.equal([resolve(__dirname, '.env.envapter-test')]);
    });

    it('should be true for isDevelopment environment by default', () => {
      expect(Envapter.isDevelopment).to.be.true;
      expect(Envapter.isProduction).to.be.false;
      expect(Envapter.isStaging).to.be.false;
      expect(Envapter.environment).to.equal(Environment.Development);
    });

    it('should allow setting custom .env path', () => {
      // Use existing test file instead of non-existent custom/.env
      const testPath = resolve(__dirname, '.env.envapter-test');
      Envapter.envPaths = testPath;
      expect(Envapter.envPaths).to.deep.equal([testPath]);
    });

    // reset to test path
    it('should set to list of .env files', () => {
      Envapter.envPaths = [resolve(__dirname, '.env.envapter-test'), resolve(__dirname, '.env.extra')];
      expect(Envapter.envPaths).to.deep.equal([
        resolve(__dirname, '.env.envapter-test'),
        resolve(__dirname, '.env.extra')
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
});
