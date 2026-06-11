import assert from 'node:assert/strict';

import { FIXTURE_PATH } from './_helpers.mjs';
import { Envapt, Envapter } from '../../../dist/node/index.mjs';

// `.mjs` has no `@Envapt` syntax. Calling the decorator as a function exercises
// the same install path tsdown-emitted user code hits at runtime.
export default async function decorator() {
    Envapter.envPaths = FIXTURE_PATH;

    class Config {}
    Envapt('BASIC_KEY', { fallback: 'default' })(Config, 'BASIC_KEY');
    Envapt('MISSING_DECORATOR_KEY', { fallback: 'fb-value' })(Config, 'MISSING_DECORATOR_KEY');
    Envapt('NUMBER_KEY', { fallback: 0, converter: Number })(Config, 'NUMBER_KEY');

    assert.equal(Config.BASIC_KEY, 'hello');
    assert.equal(Config.MISSING_DECORATOR_KEY, 'fb-value');
    assert.equal(Config.NUMBER_KEY, 42);

    class Bag {}
    Envapt('BOOL_KEY', { fallback: false })(Bag.prototype, 'enabled');
    const bag = new Bag();
    assert.equal(bag.enabled, true);
}
