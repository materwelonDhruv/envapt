import { Envapt } from '../../src';

// The positional `@Envapt(key, fallback)` form was removed in v6, so a primitive second argument
// must match no overload (TS2769). If someone re-adds the overload, 021-type-error-messages stops
// failing.
export class PositionalRemoved {
    @Envapt('HOST', 'localhost')
    declare static readonly host: string;
}
