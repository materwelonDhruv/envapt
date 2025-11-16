import { expect } from 'chai';
import { describe, it, vi } from 'vitest';

import { BuiltInConverters } from '../src/BuiltInConverters';
import { Parser } from '../src/Parser';
import { Validator } from '../src/Validators';

import type { EnvapterService } from '../src/Parser';
import type { BuiltInConverter, PrimitiveConstructor } from '../src/Types';

class StubEnvService implements EnvapterService {
    constructor(private readonly values: Record<string, string | undefined>) {}

    getRaw(key: string): string | undefined {
        return this.values[key];
    }

    get(key: string): string | undefined {
        return this.values[key];
    }
}

const createMatchResult = (...parts: (string | undefined)[]): RegExpMatchArray => {
    const result = parts as unknown as RegExpMatchArray;
    result.index = 0;
    result.input = '';
    return result;
};

const createWeirdString = (...parts: (string | undefined)[]): string =>
    ({
        match: () => createMatchResult(...parts)
    }) as unknown as string;

describe('Defensive tests', () => {
    describe('BuiltInConverters defensive fallbacks', () => {
        it('returns fallback when bigint conversion fails', () => {
            const fallback = 42n;
            expect(BuiltInConverters.bigint('not-a-bigint', fallback)).to.equal(fallback);
        });

        it('returns fallback when symbol creation throws', () => {
            const fallback = Symbol('safe');
            const symbolConstructor = Symbol as SymbolConstructor & { for: typeof Symbol.for };
            const originalSymbolFor = symbolConstructor.for;

            symbolConstructor.for = () => {
                throw new Error('nope');
            };

            try {
                expect(BuiltInConverters.symbol('anything', fallback)).to.equal(fallback);
            } finally {
                symbolConstructor.for = originalSymbolFor;
            }
        });

        it('returns fallback when symbol input is empty', () => {
            const fallback = Symbol('empty');
            expect(BuiltInConverters.symbol('', fallback)).to.equal(fallback);
        });

        it('returns fallback when array items collapse to nothing', () => {
            const fallback = ['fallback'];
            expect(BuiltInConverters.array(' , , ', fallback)).to.equal(fallback);
        });

        it('returns fallback when integer parsing fails', () => {
            const fallback = 321;
            expect(BuiltInConverters.integer('not-an-integer', fallback)).to.equal(fallback);
        });

        it('returns fallback when float parsing fails', () => {
            const fallback = 12.34;
            expect(BuiltInConverters.float('not-a-float', fallback)).to.equal(fallback);
        });

        it('returns an empty array when raw input is blank for custom array converters', () => {
            const result = BuiltInConverters.processArrayConverter('   ', undefined, { delimiter: ',' });
            expect(result).to.deep.equal([]);
        });

        it('returns fallback when custom array converter produces no items', () => {
            const fallback = ['keep-me'];
            const result = BuiltInConverters.processArrayConverter(' , , ', fallback, { delimiter: ',' });
            expect(result).to.equal(fallback);
        });

        it('preserves original value when typed conversion fails inside array converter', () => {
            const result = BuiltInConverters.processArrayConverter('1,abc', undefined, {
                delimiter: ',',
                type: 'number'
            });
            expect(result).to.deep.equal([1, 'abc']);
        });

        it('returns fallback for invalid numeric timestamp strings', () => {
            const fallback = new Date(0);
            const invalidTimestamp = '9'.repeat(400);
            expect(BuiltInConverters.date(invalidTimestamp, fallback)).to.equal(fallback);
        });

        it('returns fallback for invalid ISO date strings', () => {
            const fallback = new Date(0);
            const invalidIso = '2023-13-40T25:61:61Z';
            expect(BuiltInConverters.date(invalidIso, fallback)).to.equal(fallback);
        });

        it('returns fallback when regex match misses numeric group in time converter', () => {
            const fallback = 9999;
            const weirdInput = createWeirdString('broken', undefined, 'ms');
            expect(BuiltInConverters.time(weirdInput, fallback)).to.equal(fallback);
        });

        it('returns fallback when numeric group cannot be parsed in time converter', () => {
            const fallback = 8888;
            const weirdInput = createWeirdString('broken', 'not-a-number', 's');
            expect(BuiltInConverters.time(weirdInput, fallback)).to.equal(fallback);
        });
    });

    describe('Parser defensive code paths', () => {
        it('preserves unresolved templates when nested resolution produces placeholders', () => {
            const parser = new Parser(
                new StubEnvService({
                    TEMPLATE_ONE: '${TEMPLATE_TWO}',
                    TEMPLATE_TWO: '${TEMPLATE_THREE}'
                })
            );

            const resolved = parser.resolveTemplate('TEMPLATE_ONE', '${TEMPLATE_TWO}');
            expect(resolved).to.equal('${TEMPLATE_TWO}');
        });

        it('converts primitive Symbol constructors to built-in converters', () => {
            const parser = new Parser(new StubEnvService({ SYMBOLIC_VALUE: 'envapt' }));
            const parserInternals = parser as unknown as {
                convertPrimitiveToString: (primitiveConstructor: PrimitiveConstructor) => BuiltInConverter;
            };
            const spy = vi.spyOn(parserInternals, 'convertPrimitiveToString');
            const result = parser.convertValue('SYMBOLIC_VALUE', undefined, Symbol, false);

            expect(typeof result).to.equal('symbol');
            expect(Symbol.keyFor(result as symbol)).to.equal('envapt');
            expect(spy.mock.calls[0]?.[0]).to.equal(Symbol);
            spy.mockRestore();
        });

        it('returns null when array converter yields no items and no fallback exists', () => {
            const parser = new Parser(new StubEnvService({ EMPTY_LIST: ' , , ' }));
            const result = parser.convertValue('EMPTY_LIST', undefined, { delimiter: ',' }, false);
            expect(result).to.be.null;
        });

        it('maps primitive Symbol constructors directly via internal converter', () => {
            const parser = new Parser(new StubEnvService({}));
            const unsafeParser = parser as unknown as {
                convertPrimitiveToString: (primitiveConstructor: PrimitiveConstructor) => BuiltInConverter;
            };
            expect(unsafeParser.convertPrimitiveToString(Symbol)).to.equal('symbol');
        });
    });

    describe('Validator primitive coercion', () => {
        it('coerces mismatched values into symbols', () => {
            const validatorInternals = Validator as unknown as {
                performPrimitiveCoercion: <CoercedType>(
                    converter: typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol,
                    fallback: unknown
                ) => CoercedType;
            };
            const spy = vi.spyOn(validatorInternals, 'performPrimitiveCoercion');

            const result = Validator.coercePrimitiveFallback<symbol>(Symbol, 'runtime-value');
            expect(typeof result).to.equal('symbol');
            expect(Symbol.keyFor(result)).to.equal('runtime-value');
            expect(spy.mock.calls[0]).to.deep.equal([Symbol, 'runtime-value']);
            spy.mockRestore();
        });

        it('performs low-level symbol coercion through the private helper', () => {
            const unsafeValidator = Validator as unknown as {
                performPrimitiveCoercion: <CoercedType>(
                    converter: typeof String | typeof Number | typeof Boolean | typeof BigInt | typeof Symbol,
                    fallback: unknown
                ) => CoercedType;
            };

            const coerced = unsafeValidator.performPrimitiveCoercion<symbol>(Symbol, 'another-runtime-value');
            expect(Symbol.keyFor(coerced)).to.equal('another-runtime-value');
        });
    });
});
