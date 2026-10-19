import { type as ark } from 'arktype';
import * as v from 'valibot';
import { expectTypeOf } from 'vitest';
import { z } from 'zod/v4';

import { Converters, Envapter } from '../src';

expectTypeOf(Envapter.getRequired('PORT', Converters.Port)).toEqualTypeOf<number>();
expectTypeOf(Envapter.getRequired('CACHE_TTL', Converters.Time)).toEqualTypeOf<number>();
expectTypeOf(Envapter.getRequired('ORIGINS', Converters.array())).toEqualTypeOf<string[]>();
expectTypeOf(Envapter.getRequired('PORTS', Converters.array({ of: Converters.Port }))).toEqualTypeOf<number[]>();
expectTypeOf(Envapter.getRequired('REGION', (raw) => raw.toUpperCase())).toEqualTypeOf<string>();
expectTypeOf(Envapter.getRequired('POOL_SIZE', z.coerce.number().int())).toEqualTypeOf<number>();

// @ts-expect-error getRequired has no fallback parameter
Envapter.getRequired('PORT', Converters.Port, 3000);

expectTypeOf(
    Envapter.getRequiredAll({
        PORT: Converters.Port,
        REGION: (raw) => raw.toUpperCase(),
        POOL_SIZE: z.coerce.number().int(),
        DATABASE_URL: v.pipe(v.string(), v.url()),
        WORKERS: ark('string.integer.parse'),
        TAGS: Converters.array()
    })
).toEqualTypeOf<{
    PORT: number;
    REGION: string;
    POOL_SIZE: number;
    DATABASE_URL: string;
    WORKERS: number;
    TAGS: string[];
}>();

expectTypeOf(Envapter.getRequiredAll({ UNSET_LATER: z.string().transform(() => undefined) })).toEqualTypeOf<{
    UNSET_LATER: undefined;
}>();

const spec = {
    DATABASE_URL: Converters.Url,
    OAUTH2_CLIENT_ID: Converters.String,
    A_B_C_D: Converters.String,
    FOO__BAR: Converters.String,
    _LEADING_KEY: Converters.String,
    TRAILING_KEY_: Converters.String
};

expectTypeOf(Envapter.getRequiredAll(spec)).toEqualTypeOf<{
    DATABASE_URL: URL;
    OAUTH2_CLIENT_ID: string;
    A_B_C_D: string;
    FOO__BAR: string;
    _LEADING_KEY: string;
    TRAILING_KEY_: string;
}>();
expectTypeOf(Envapter.getRequiredAll(spec, 'camelCase')).toEqualTypeOf<{
    databaseUrl: URL;
    oauth2ClientId: string;
    aBCD: string;
    fooBar: string;
    leadingKey: string;
    trailingKey: string;
}>();
expectTypeOf(Envapter.getRequiredAll(spec, 'PascalCase')).toEqualTypeOf<{
    DatabaseUrl: URL;
    Oauth2ClientId: string;
    ABCD: string;
    FooBar: string;
    LeadingKey: string;
    TrailingKey: string;
}>();
expectTypeOf(Envapter.getRequiredAll(spec, 'kebab-case')).toEqualTypeOf<{
    'database-url': URL;
    'oauth2-client-id': string;
    'a-b-c-d': string;
    'foo-bar': string;
    'leading-key': string;
    'trailing-key': string;
}>();
