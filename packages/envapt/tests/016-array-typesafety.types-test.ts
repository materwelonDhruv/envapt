import { expectTypeOf } from 'vitest';

import { Converters, Envapter } from '../src';

expectTypeOf(Envapter.getAs('PORTS', Converters.array({ of: Converters.Number }))).toEqualTypeOf<
    number[] | undefined
>();
expectTypeOf(Envapter.getAs('TAGS', Converters.array())).toEqualTypeOf<string[] | undefined>();
expectTypeOf(Envapter.getAs('DATES', Converters.array({ of: (raw: string) => new Date(raw) }))).toEqualTypeOf<
    Date[] | undefined
>();

// @ts-expect-error json can't be an array element
Converters.array({ of: Converters.Json });
// @ts-expect-error regexp can't be an array element
Converters.array({ of: Converters.RegExp });
