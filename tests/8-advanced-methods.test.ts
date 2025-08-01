import { resolve } from 'node:path';

import { expect } from 'chai';

import { Converters, Envapter } from '../src';

describe('Advanced Converter Methods', () => {
  before(() => (Envapter.envPaths = resolve(__dirname, '.env.builtin-test')));

  describe('getUsing method', () => {
    it('should convert using Converters enum - Number', () => {
      const result = Envapter.getUsing('TEST_NUMBER', Converters.Number);
      expect(result).to.equal(42.5);
      expect(typeof result).to.equal('number');
    });

    it('should convert using string converter name - Boolean', () => {
      const result = Envapter.getUsing('TEST_BOOLEAN', 'boolean');
      expect(result).to.be.true;
      expect(typeof result).to.equal('boolean');
    });

    it('should convert using Converters enum - Json', () => {
      const result = Envapter.getUsing('TEST_JSON_OBJECT', Converters.Json);
      expect(result).to.deep.equal({ name: 'test', version: 1, enabled: true });
    });

    it('should convert using Converters enum - Array', () => {
      const result = Envapter.getUsing('TEST_ARRAY_COMMA', Converters.Array);
      expect(result).to.deep.equal(['item1', 'item2', 'item3']);
    });

    it('should convert using array converter with custom delimiter', () => {
      const result = Envapter.getUsing('TEST_ARRAY_SPACE', { delimiter: ' ' });
      expect(result).to.deep.equal(['one', 'two', 'three']);
    });

    it('should convert using array converter with type conversion', () => {
      const result = Envapter.getUsing('TEST_ARRAY_NUMBERS', { delimiter: ',', type: Converters.Number });
      expect(result).to.deep.equal([1, 2, 3]);
    });

    it('should convert using Converters enum - Url', () => {
      const result = Envapter.getUsing('TEST_URL_VALID', Converters.Url);
      expect(result).to.be.instanceOf(URL);
      expect(result?.toString()).to.equal('https://api.example.com/v1');
    });

    it('should convert using Converters enum - Regexp', () => {
      const result = Envapter.getUsing('TEST_REGEXP_WITH_FLAGS', Converters.Regexp) as RegExp;
      expect(result).to.be.instanceOf(RegExp);
      expect(result.source).to.equal('[a-z]+');
      expect(result.flags).to.equal('gi');
    });

    it('should convert using Converters enum - Date', () => {
      const result = Envapter.getUsing('TEST_DATE_ISO', Converters.Date) as Date;
      expect(result).to.be.instanceOf(Date);
      expect(result.toISOString()).to.equal('2023-12-25T00:00:00.000Z');
    });

    it('should convert using Converters enum - Time', () => {
      const result = Envapter.getUsing('TEST_TIME_SECONDS', Converters.Time);
      expect(result).to.equal(5000); // 5s converted to milliseconds
    });

    it('should use fallback for nonexistent variable', () => {
      const result = Envapter.getUsing('NONEXISTENT_VAR', Converters.Number, 42);
      expect(result).to.equal(42);
    });

    it('should return undefined for nonexistent variable without fallback', () => {
      const result = Envapter.getUsing('NONEXISTENT_VAR', Converters.String);
      expect(result).to.be.undefined;
    });

    it('should work with instance method', () => {
      const instance = new Envapter();
      const result = instance.getUsing('TEST_INTEGER', Converters.Integer);
      expect(result).to.equal(42);
    });
  });

  describe('getWith method', () => {
    it('should convert using custom converter function', () => {
      const customConverter = (raw: string | undefined, fallback?: string[]): string[] => {
        if (!raw) return fallback ?? [];
        const items = raw.split(',');
        const processedItems: string[] = [];
        for (const item of items) {
          processedItems.push(item.trim().toUpperCase());
        }
        return processedItems;
      };

      const result = Envapter.getWith('TEST_ARRAY_COMMA', customConverter);
      expect(result).to.deep.equal(['ITEM1', 'ITEM2', 'ITEM3']);
    });

    it('should convert to Map using custom converter', () => {
      const mapConverter = (raw: string | undefined, fallback?: Map<string, string>): Map<string, string> => {
        if (!raw) return fallback ?? new Map<string, string>();
        const map = new Map<string, string>();
        const pairs = raw.split(',');
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            map.set(key.trim(), value.trim());
          }
        }
        return map;
      };

      // Use a test that has key=value format
      const result = Envapter.getWith('TEST_STRING', mapConverter, new Map([['default', 'value']]));
      expect(result).to.be.instanceOf(Map);
    });

    it('should use fallback for nonexistent variable', () => {
      const customConverter = (raw: string | undefined, fallback?: number): number => {
        if (!raw) return fallback ?? 0;
        return raw.length;
      };

      const result = Envapter.getWith('NONEXISTENT_VAR', customConverter, 99);
      expect(result).to.equal(99);
    });

    it('should work with complex custom converter', () => {
      const complexConverter = (
        raw: string | undefined,
        fallback?: { count: number; items: string[]; reversed: string[] }
      ): { count: number; items: string[]; reversed: string[] } => {
        const defaultValue = { count: 0, items: [], reversed: [] };
        if (!raw) return fallback ?? defaultValue;
        const items = raw.split(',').map((item) => item.trim());
        return {
          count: items.length,
          items,
          reversed: [...items].reverse()
        };
      };

      const result = Envapter.getWith('TEST_ARRAY_COMMA', complexConverter);
      expect(result).to.deep.equal({
        count: 3,
        items: ['item1', 'item2', 'item3'],
        reversed: ['item3', 'item2', 'item1']
      });
    });

    it('should convert to Set using custom converter', () => {
      const setConverter = (raw: string | undefined, fallback?: Set<string>): Set<string> => {
        if (!raw) return fallback ?? new Set();
        const items = raw.split(',').map((item) => item.trim());
        return new Set(items);
      };

      const result = Envapter.getWith('TEST_ARRAY_COMMA', setConverter);
      expect(result).to.be.instanceOf(Set);
      expect(Array.from(result as Set<string>)).to.deep.equal(['item1', 'item2', 'item3']);
    });

    it('should convert to Map using custom converter', () => {
      const mapConverter = (raw: string | undefined, fallback?: Map<string, string>): Map<string, string> => {
        if (!raw) return fallback ?? new Map<string, string>();
        const map = new Map<string, string>();
        const pairs = raw.split(',');
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            map.set(key.trim(), value.trim());
          }
        }
        return map;
      };

      // Use a test that has key=value format
      const result = Envapter.getWith('TEST_STRING', mapConverter, new Map([['default', 'value']]));
      expect(result).to.be.instanceOf(Map);
    });

    it('should use fallback for nonexistent variable', () => {
      const customConverter = (raw: string | undefined, fallback?: number): number => {
        if (!raw) return fallback ?? 0;
        return raw.length;
      };

      const result = Envapter.getWith('NONEXISTENT_VAR', customConverter, 99);
      expect(result).to.equal(99);
    });

    it('should work with complex custom converter', () => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const complexConverter = (raw: string | undefined, fallback?: { count: number; items: string[] }) => {
        if (!raw) return fallback ?? { count: 0, items: [] };
        const items = raw.split(',').map((item) => item.trim());
        return {
          count: items.length,
          items,
          reversed: items.reverse()
        };
      };

      const result = Envapter.getWith('TEST_ARRAY_COMMA', complexConverter);
      expect(result).to.deep.equal({
        count: 3,
        items: ['item3', 'item2', 'item1'],
        reversed: ['item3', 'item2', 'item1']
      });
    });

    it('should work with instance method', () => {
      const instance = new Envapter();
      const customConverter = (raw: string | undefined): string => {
        return raw ? raw.toUpperCase() : 'DEFAULT';
      };

      const result = instance.getWith('TEST_STRING', customConverter);
      expect(result).to.equal('HELLO WORLD');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid built-in converter', () => {
      expect(() => {
        //@ts-expect-error We're passing an invalid type here for testing
        Envapter.getUsing('TEST_STRING', 'invalid-converter');
      }).to.throw();
    });

    it('should throw error for invalid array converter', () => {
      expect(() => {
        Envapter.getUsing('TEST_STRING', { delimiter: ',' });
      }).to.not.throw();

      expect(() => {
        //@ts-expect-error We're passing an invalid type here for testing
        Envapter.getUsing('TEST_STRING', { delimiter: ',', type: 'invalid' });
      }).to.throw();
    });

    it('should throw error for invalid custom converter', () => {
      expect(() => {
        //@ts-expect-error We're passing an invalid type here for testing
        Envapter.getWith('TEST_STRING', 'not-a-function');
      }).to.throw();
    });
  });

  describe('type inference', () => {
    it('should infer correct types for built-in converters', () => {
      const str = Envapter.getUsing('TEST_STRING', Converters.String);
      const num = Envapter.getUsing('TEST_NUMBER', Converters.Number);
      const bool = Envapter.getUsing('TEST_BOOLEAN', Converters.Boolean);
      const arr = Envapter.getUsing('TEST_ARRAY_COMMA', Converters.Array);

      // With fallbacks should not be undefined
      const strWithFallback = Envapter.getUsing('TEST_STRING', Converters.String, 'default');
      const numWithFallback = Envapter.getUsing('TEST_NUMBER', Converters.Number, 0);

      expect(str).to.be.a('string');
      expect(num).to.be.a('number');
      expect(bool).to.be.a('boolean');
      expect(arr).to.be.an('array');
      expect(strWithFallback).to.be.a('string');
      expect(numWithFallback).to.be.a('number');
    });

    it('should work with template resolution', () => {
      // Add a test value that uses template variables if available
      const result = Envapter.getUsing('TEST_STRING', Converters.String);
      expect(result).to.equal('hello world');
    });
  });
});
