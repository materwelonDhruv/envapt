import { resolve } from 'node:path';

import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';

import { Converters, Envapt, Envapter, EnvaptErrorCodes } from '../src';
import { EnvaptError } from '../src/Error';

import type { ArrayOf } from '../src';

describe('ArrayConverter typesafety (v5) — runtime', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.018-array')));

    describe('throws on element conversion failure', () => {
        class F1Tests {
            @Envapt('PORTS_BAD', { converter: Converters.array({ of: Converters.Number }), fallback: [] })
            static readonly ports: number[];

            @Envapt('FLAGS_BAD', { converter: Converters.array({ of: Converters.Boolean }), fallback: [] })
            static readonly flags: boolean[];

            @Envapt('TIMES_BAD', { converter: Converters.array({ of: Converters.Time }), fallback: [] })
            static readonly times: number[];

            @Envapt('URLS_BAD', { converter: Converters.array({ of: Converters.Url }), fallback: [] })
            static readonly urls: URL[];

            @Envapt('DATES_BAD', { converter: Converters.array({ of: Converters.Date }), fallback: [] })
            static readonly dates: Date[];
        }

        const failureCases: ['ports' | 'flags' | 'times' | 'urls' | 'dates'][] = [
            ['ports'],
            ['flags'],
            ['times'],
            ['urls'],
            ['dates']
        ];

        failureCases.forEach(([key]) => {
            it(`throws ArrayElementConversionFailed for ${key}`, () => {
                expect(() => F1Tests[key])
                    .to.throw(EnvaptError)
                    .with.property('code', EnvaptErrorCodes.ArrayElementConversionFailed);
            });
        });
    });

    describe('permissive default filters empty items, never throws on empties', () => {
        class F2Tests {
            @Envapt('LIST_WITH_GAPS', { converter: Converters.array({ of: Converters.Number }), fallback: [] })
            static readonly list: number[];
        }

        it('filters empty/whitespace items before conversion', () => {
            // env value is `1, , 2, ,,3` per the fixture; permissive default trims empties first
            expect(F2Tests.list).to.deep.equal([1, 2, 3]);
        });
    });

    describe('custom function as element converter', () => {
        class S4Tests {
            @Envapt('UPPERCASE_TAGS', {
                converter: Converters.array({ of: (raw) => raw.toUpperCase() }),
                fallback: []
            })
            static readonly upperTags: string[];

            @Envapt('PARSED_NUMS', {
                converter: Converters.array({ of: (raw) => Number.parseInt(raw, 16) }),
                fallback: []
            })
            static readonly hexNums: number[];

            @Envapt('FAILING_CUSTOM', {
                converter: Converters.array({ of: (raw) => (raw === 'good' ? raw : undefined) as string }),
                fallback: []
            })
            static readonly failing: string[];
        }

        it('runs each element through the custom function', () => {
            expect(S4Tests.upperTags).to.deep.equal(['ALPHA', 'BETA', 'GAMMA']);
        });

        it('infers element type from the function return type', () => {
            expect(S4Tests.hexNums).to.deep.equal([255, 16, 65535]);
        });

        it('throws ArrayElementConversionFailed when the custom function returns undefined', () => {
            expect(() => S4Tests.failing)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.ArrayElementConversionFailed);
        });
    });

    describe('TimeFallback array symmetry', () => {
        class S5Tests {
            @Envapt('NONEXISTENT_TIMES_NUM', {
                converter: Converters.array({ of: Converters.Time }),
                fallback: [5000, 60000, 600000]
            })
            static readonly timesNumberFallback: number[];

            @Envapt('NONEXISTENT_TIMES_STR', {
                converter: Converters.array({ of: Converters.Time }),
                fallback: ['5s', '1m', '10m']
            })
            static readonly timesStringFallback: number[];

            @Envapt('TIMES_PRESENT', {
                converter: Converters.array({ of: Converters.Time }),
                fallback: ['1m']
            })
            static readonly timesPresent: number[];
        }

        it('accepts number[] fallback when of is Time', () => {
            expect(S5Tests.timesNumberFallback).to.deep.equal([5000, 60000, 600000]);
        });

        it('accepts TimeFallback[] (string[]) fallback when of is Time and coerces to number[]', () => {
            expect(S5Tests.timesStringFallback).to.deep.equal([5000, 60000, 600000]);
        });

        it('still parses raw env time-strings into number[] when env value is set', () => {
            // fixture: TIMES_PRESENT=2s,3m,1h
            expect(S5Tests.timesPresent).to.deep.equal([2000, 180000, 3600000]);
        });
    });

    describe('Defaults and basic shape', () => {
        class DefaultTests {
            @Envapt('DEFAULT_CSV', { converter: Converters.array(), fallback: [] })
            static readonly csv: string[];

            @Envapt('PIPE_SEPARATED', { converter: Converters.array({ delimiter: '|' }), fallback: [] })
            static readonly piped: string[];
        }

        it('defaults of=String, delimiter=","', () => {
            expect(DefaultTests.csv).to.deep.equal(['a', 'b', 'c']);
        });

        it('honors a custom delimiter when of is omitted (still string[])', () => {
            expect(DefaultTests.piped).to.deep.equal(['x', 'y', 'z']);
        });
    });

    describe('variable indirection preserves inference', () => {
        const portsBuilder = Converters.array({ of: Converters.Number });
        const csvBuilder = Converters.array();

        class F3Tests {
            @Envapt('PORTS_INDIRECT', { converter: portsBuilder, fallback: [] })
            static readonly ports: number[];

            @Envapt('CSV_INDIRECT', { converter: csvBuilder, fallback: [] })
            static readonly csv: string[];
        }

        it('decorator still resolves correctly when the builder is hoisted to a variable', () => {
            expect(F3Tests.ports).to.deep.equal([8080, 8081]);
            expect(F3Tests.csv).to.deep.equal(['alpha', 'beta']);
        });
    });
});

describe('ArrayConverter typesafety (v5) — compile-time (expect-type)', () => {
    it('Converters.array({ of: Converters.Number }) infers ArrayOf<"number">', () => {
        const t = Converters.array({ of: Converters.Number });
        expectTypeOf(t).toEqualTypeOf<ArrayOf<'number'>>();
        expectTypeOf(t.of).toEqualTypeOf<'number'>();
    });

    it('Converters.array() infers ArrayOf<"string">', () => {
        const t = Converters.array();
        expectTypeOf(t).toEqualTypeOf<ArrayOf<'string'>>();
    });

    it('custom function element preserves the function type', () => {
        const fn = (raw: string): Date => new Date(raw);
        const t = Converters.array({ of: fn });
        expectTypeOf(t.of).toEqualTypeOf<typeof fn>();
    });

    it('assigning the builder result to a const preserves the literal element type', () => {
        const builder = Converters.array({ of: Converters.Number });
        expectTypeOf(builder).toEqualTypeOf<ArrayOf<'number'>>();

        const widerVar: ArrayOf<'number'> = Converters.array({ of: Converters.Number });
        expectTypeOf(widerVar.of).toEqualTypeOf<'number'>();
    });

    it('@Envapt accepts TimeFallback[] (string[]) fallback for of:Time arrays', () => {
        // If this class type-checks, time-array fallback symmetry holds (the decorator's
        // fallback slot typechecks as TimeFallback[] for `of: Converters.Time`).
        class TimeArrayFallbackCheck extends Envapter {
            @Envapt('X', {
                converter: Converters.array({ of: Converters.Time }),
                fallback: ['5s', '1m']
            })
            declare readonly stringFallback: number[];

            @Envapt('Y', {
                converter: Converters.array({ of: Converters.Time }),
                fallback: [5000, 60000]
            })
            declare readonly numberFallback: number[];
        }
        expectTypeOf<TimeArrayFallbackCheck>().toHaveProperty('stringFallback');
        expectTypeOf<TimeArrayFallbackCheck>().toHaveProperty('numberFallback');
    });

    it('rejects of: Converters.Json at the type level', () => {
        // @ts-expect-error 'json' is excluded from ArrayElement
        Converters.array({ of: Converters.Json });
    });

    it('rejects of: Converters.Regexp at the type level', () => {
        // @ts-expect-error 'regexp' is excluded from ArrayElement
        Converters.array({ of: Converters.Regexp });
    });
});
