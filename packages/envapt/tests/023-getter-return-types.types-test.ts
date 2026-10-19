import { expectTypeOf } from 'vitest';

import { Converters, Envapter } from '../src';

interface FeatureFlags {
    beta: boolean;
}

declare function optionalFlags(): FeatureFlags | undefined;

expectTypeOf(Envapter.get('API_HOST')).toEqualTypeOf<string | undefined>();
expectTypeOf(Envapter.get('API_HOST', 'localhost')).toEqualTypeOf<string>();

expectTypeOf(Envapter.getAs('PORT', Converters.Port, 3000)).toEqualTypeOf<number>();
expectTypeOf(Envapter.getAs('CACHE_TTL', Converters.Time, '5m')).toEqualTypeOf<number>();
expectTypeOf(Envapter.getAs('TTLS', Converters.array({ of: Converters.Time }), ['5m'])).toEqualTypeOf<number[]>();

// @ts-expect-error a port fallback is a number
Envapter.getAs('PORT', Converters.Port, 'abc');
// @ts-expect-error a duration fallback is milliseconds or a time string
Envapter.getAs('CACHE_TTL', Converters.Time, true);
// @ts-expect-error a number array fallback holds numbers
Envapter.getAs('RETRIES', Converters.array({ of: Converters.Number }), [2738, '234']);

expectTypeOf(Envapter.getAs<FeatureFlags>('FEATURE_FLAGS', Converters.Json)).toEqualTypeOf<FeatureFlags | undefined>();
expectTypeOf(
    Envapter.getAs<FeatureFlags>('FEATURE_FLAGS', Converters.Json, { beta: false })
).toEqualTypeOf<FeatureFlags>();
expectTypeOf(Envapter.getAs<FeatureFlags>('FEATURE_FLAGS', Converters.Json, optionalFlags())).toEqualTypeOf<
    FeatureFlags | undefined
>();
