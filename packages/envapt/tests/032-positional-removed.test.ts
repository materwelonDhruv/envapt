import { describe, expect, it } from 'vitest';

import { Envapt, EnvaptError } from '../src';

// The positional `@Envapt(key, fallback, converter)` form was removed in v6. The type overloads
// reject it, so this guards the runtime path a caller still reaches through a cast or plain JS.
describe('removed positional @Envapt form', () => {
    // Fixture cast: the positional signature no longer exists on the public type, so it is
    // recreated here to drive the runtime guard a JS caller would hit.
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
