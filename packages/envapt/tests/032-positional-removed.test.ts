import { describe, expect, it } from 'vitest';

import { EnvaptError } from '../src';
import { Envapt } from '../src/legacy';

// v6 removed the positional `@Envapt(key, fallback, converter)` form. plain JS can still call it.
describe('removed positional @Envapt form', () => {
    // the old positional signature
    const positional = Envapt as unknown as (key: string, fallback: unknown, converter?: unknown) => PropertyDecorator;

    it('throws when a non-options second argument is passed', () => {
        expect(() => positional('PORT', 8080)).to.throw(EnvaptError);
    });

    it('throws on the three-argument form', () => {
        expect(() => positional('PORT', 8080, Number)).to.throw(EnvaptError);
    });

    it('still accepts the no-argument form', () => {
        expect(() => Envapt('PORT')).to.not.throw();
    });
});
