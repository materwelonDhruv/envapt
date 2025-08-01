import { expect } from 'chai';

import { Envapt, Envapter } from '../src';

// Testing what happens when env paths aren't explicitly set AND no .env file exists
// Basically, it should work regardless.
describe('Missing .env file handling', () => {
  describe('when no .env file exists at default location', () => {
    class TestEnvWithoutFile {
      @Envapt('NONEXISTENT_VAR', 'fallback-value')
      public static readonly nonexistentVar: string;

      @Envapt('ANOTHER_NONEXISTENT_VAR', 42)
      public static readonly anotherNonexistentVar: number;

      @Envapt('PROCESS_ENV_VAR')
      public static readonly processEnvVar: string | null;
    }

    it('should use fallback values when no .env file exists', () => {
      expect(TestEnvWithoutFile.nonexistentVar).to.equal('fallback-value');
      expect(TestEnvWithoutFile.anotherNonexistentVar).to.equal(42);
    });

    it('should return null for variables without fallback when no .env file exists', () => {
      expect(TestEnvWithoutFile.processEnvVar).to.be.null;
    });

    it('should still work with functional API when no .env file exists', () => {
      const envValue = Envapter.get('NONEXISTENT_FUNCTIONAL_VAR', 'functional-fallback');
      expect(envValue).to.equal('functional-fallback');

      const numberValue = Envapter.getNumber('NONEXISTENT_NUMBER_VAR', 123);
      expect(numberValue).to.equal(123);

      const booleanValue = Envapter.getBoolean('NONEXISTENT_BOOLEAN_VAR', true);
      expect(booleanValue).to.be.true;
    });

    it('should handle environment detection when no .env file exists', () => {
      expect(Envapter.isDevelopment).to.be.true;
      expect(Envapter.isProduction).to.be.false;
      expect(Envapter.isStaging).to.be.false;
    });
  });
});
