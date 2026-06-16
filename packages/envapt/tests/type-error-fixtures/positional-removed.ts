import { Envapt } from '../../src';

// The positional `@Envapt(key, fallback)` form was removed in v6, so a primitive second argument
// must match no overload (TS2769). If someone re-adds the overload, this compiles cleanly with no
// TS2769 and 021-type-error-messages starts failing.
export class PositionalRemoved {
    @Envapt('HOST', 'localhost')
    static readonly host: string;
}
