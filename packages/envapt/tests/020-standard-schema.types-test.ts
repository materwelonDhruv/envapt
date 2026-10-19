import { expectTypeOf } from 'vitest';
import { z } from 'zod/v4';

import { Envapter } from '../src';

expectTypeOf(Envapter.getAs('POOL_SIZE', z.coerce.number())).toEqualTypeOf<number | undefined>();
expectTypeOf(Envapter.getAs('POOL_SIZE', z.coerce.number(), 10)).toEqualTypeOf<number>();
expectTypeOf(Envapter.getAs('LOG_LEVEL', z.enum(['debug', 'info', 'warn']), 'info')).toEqualTypeOf<
    'debug' | 'info' | 'warn'
>();
