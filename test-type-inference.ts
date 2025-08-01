// Test file to verify type inference for the new methods
import { Envapter, Converters } from './src';

// Test getUsing with built-in converters
const str = Envapter.getUsing('TEST_VAR', Converters.String);
// str should be: string | undefined

const strWithFallback = Envapter.getUsing('TEST_VAR', Converters.String, 'default');
// strWithFallback should be: string

const num = Envapter.getUsing('TEST_VAR', Converters.Number);
// num should be: number | undefined

const numWithFallback = Envapter.getUsing('TEST_VAR', Converters.Number, 42);
// numWithFallback should be: number

const json = Envapter.getUsing('TEST_VAR', Converters.Json);
// json should be: JsonValue | undefined

const jsonWithFallback = Envapter.getUsing('TEST_VAR', Converters.Json, { default: true });
// jsonWithFallback should be: JsonValue

const array = Envapter.getUsing('TEST_VAR', Converters.Array);
// array should be: string[] | undefined

const arrayWithFallback = Envapter.getUsing('TEST_VAR', Converters.Array, ['default']);
// arrayWithFallback should be: string[]

const typedArray = Envapter.getUsing('TEST_VAR', { delimiter: ',', type: Converters.Number });
// typedArray should be: number[] | undefined

const typedArrayWithFallback = Envapter.getUsing('TEST_VAR', { delimiter: ',', type: Converters.Number }, [1, 2, 3]);
// typedArrayWithFallback should be: number[]

// Test getWith with custom converters
const customResult = Envapter.getWith('TEST_VAR', (raw: string | undefined) => {
  return raw ? raw.toUpperCase() : 'DEFAULT';
});
// customResult should be: string | undefined

const customWithFallback = Envapter.getWith(
  'TEST_VAR',
  (raw: string | undefined) => {
    return raw ? raw.toUpperCase() : 'DEFAULT';
  },
  'FALLBACK'
);
// customWithFallback should be: string

const complexCustom = Envapter.getWith('TEST_VAR', (raw: string | undefined): { processed: boolean; value: string } => {
  return { processed: !!raw, value: raw || 'empty' };
});
// complexCustom should be: { processed: boolean; value: string } | undefined

console.log('Type inference test completed successfully!');
