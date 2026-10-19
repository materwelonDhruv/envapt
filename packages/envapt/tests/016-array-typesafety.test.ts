import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { Converters, Envapter, EnvaptError, EnvaptErrorCodes } from '../src';
import { Envapt } from '../src/legacy';

describe('ArrayConverter typesafety (v5) — runtime', () => {
    beforeAll(() => (Envapter.envPaths = resolve(import.meta.dirname, '.env.016-array')));

    it('throws ArrayElementConversionFailed when an element cannot convert', () => {
        class F1Tests {
            @Envapt('PORTS_BAD', { converter: Converters.array({ of: Converters.Number }), fallback: [] })
            static readonly ports: number[];
        }
        expect(() => F1Tests.ports)
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.ArrayElementConversionFailed);
    });

    it('filters empty/whitespace items before conversion', () => {
        class F2Tests {
            @Envapt('LIST_WITH_GAPS', { converter: Converters.array({ of: Converters.Number }), fallback: [] })
            static readonly list: number[];
        }
        // fixture LIST_WITH_GAPS is `1, , 2, ,,3`. outside strict mode the empty items are removed
        expect(F2Tests.list).to.deep.equal([1, 2, 3]);
    });

    describe('custom function as element converter', () => {
        class S4Tests {
            @Envapt('UPPERCASE_TAGS', {
                converter: Converters.array({ of: (raw) => raw.toUpperCase() }),
                fallback: []
            })
            static readonly upperTags: string[];

            @Envapt('FAILING_CUSTOM', {
                converter: Converters.array({ of: (raw) => (raw === 'good' ? raw : undefined) }),
                fallback: []
            })
            static readonly failing: string[];

            @Envapt('FAILING_CUSTOM', {
                converter: Converters.array({ of: (raw) => (raw === 'good' ? raw : null) }),
                fallback: []
            })
            static readonly failingNull: string[];
        }

        it('runs each element through the custom function', () => {
            expect(S4Tests.upperTags).to.deep.equal(['ALPHA', 'BETA', 'GAMMA']);
        });

        it('throws ArrayElementConversionFailed when the custom function returns undefined or null', () => {
            expect(() => S4Tests.failing)
                .to.throw(EnvaptError)
                .with.property('code', EnvaptErrorCodes.ArrayElementConversionFailed);
            expect(() => S4Tests.failingNull)
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
        }

        it('accepts number[] fallback when of is Time', () => {
            expect(S5Tests.timesNumberFallback).to.deep.equal([5000, 60000, 600000]);
        });

        it('accepts TimeFallback[] (string[]) fallback when of is Time and coerces to number[]', () => {
            expect(S5Tests.timesStringFallback).to.deep.equal([5000, 60000, 600000]);
        });
    });
});
