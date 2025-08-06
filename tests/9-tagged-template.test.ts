import { resolve } from 'node:path';

import { expect } from 'chai';
import { it, describe, before } from 'mocha';

import { Envapter } from '../src/index.ts';

const importMeta = import.meta as { dirname: string }

describe('Tagged Template Resolver', () => {
  before(() => (Envapter.envPaths = resolve(importMeta.dirname + '.env.tagged-template-test')));

  describe('static resolve method', () => {
    it('should resolve environment variables in template strings', () => {
      const message = Envapter.resolve`Hello, my name is ${'USERNAME'} and I am ${'AGE'} years old.`;
      expect(message).to.equal('Hello, my name is john and I am 25 years old.');
    });

    it('should handle multiple environment variables', () => {
      const info = Envapter.resolve`${'USERNAME'} works at ${'COMPANY'} in ${'CITY'}.`;
      expect(info).to.equal('john works at TechCorp in New York.');
    });

    it('should handle missing environment variables with empty string fallback', () => {
      const message = Envapter.resolve`Hello ${'NONEXISTENT'}, welcome!`;
      expect(message).to.equal('Hello , welcome!');
    });

    it('should handle template strings with no variables', () => {
      const message = Envapter.resolve`This is a simple string.`;
      expect(message).to.equal('This is a simple string.');
    });

    it('should handle empty environment variables', () => {
      const message = Envapter.resolve`Value: ${'MISSING_VAR'}!`;
      expect(message).to.equal('Value: !');
    });

    it('should work with single variable', () => {
      const message = Envapter.resolve`${'USERNAME'}`;
      expect(message).to.equal('john');
    });

    it('should handle complex templates with mixed content', () => {
      const template = Envapter.resolve`
        User: ${'USERNAME'}
        Age: ${'AGE'}
        Location: ${'LOCATION'}
        Company: ${'COMPANY'}
      `;
      expect(template).to.equal(`
        User: john
        Age: 25
        Location: New York, USA
        Company: TechCorp
      `);
    });
  });

  describe('instance resolve method', () => {
    it('should work the same as static method', () => {
      const env = new Envapter();
      const message = env.resolve`Hello, my name is ${'USERNAME'} and I am ${'AGE'} years old.`;
      expect(message).to.equal('Hello, my name is john and I am 25 years old.');
    });

    it('should handle multiple variables on instance', () => {
      const env = new Envapter();
      const info = env.resolve`${'USERNAME'} works at ${'COMPANY'}.`;
      expect(info).to.equal('john works at TechCorp.');
    });
  });

  describe('edge cases', () => {
    it('should handle variables that contain numbers', () => {
      const message = Envapter.resolve`Age is ${'AGE'}`;
      expect(message).to.equal('Age is 25');
    });

    it('should handle variables with spaces in values', () => {
      const message = Envapter.resolve`City: ${'CITY'}`;
      expect(message).to.equal('City: New York');
    });

    it('should handle consecutive variables', () => {
      const message = Envapter.resolve`${'USERNAME'}${'AGE'}`;
      expect(message).to.equal('john25');
    });
  });
});
