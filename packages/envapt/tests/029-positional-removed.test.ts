import { describe, expect, it } from 'vitest';

import { EnvaptError, EnvaptErrorCodes } from '../src';
import { Envapt } from '../src/legacy';

// plain JS can still call the removed positional form
describe('@Envapt options validation', () => {
    const untyped = Envapt as unknown as (key: string, options: unknown) => PropertyDecorator;

    it('throws InvalidUserDefinedConfig for a non-object second argument', () => {
        expect(() => untyped('PORT', 8080))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });

    it('throws InvalidUserDefinedConfig for an empty options object', () => {
        expect(() => untyped('PORT', {}))
            .to.throw(EnvaptError)
            .with.property('code', EnvaptErrorCodes.InvalidUserDefinedConfig);
    });
});
