import assert from 'node:assert/strict';

import { FIXTURE_PATH } from './_helpers.mjs';
import { Converters, EnvaptError, EnvaptErrorCodes, Envapter } from '../../../dist/index.mjs';

export default async function fallbacks() {
    Envapter.envPaths = FIXTURE_PATH;

    assert.equal(Envapter.get('MISSING_KEY', 'default'), 'default');
    assert.equal(Envapter.getNumber('MISSING_KEY', 7), 7);
    assert.equal(Envapter.getBoolean('MISSING_KEY', false), false);

    // Fallback-type validation only fires through `getUsing` / decorators, not on
    // typed primitive getters like `getNumber`.
    assert.throws(
        () => Envapter.getUsing('MISSING_KEY', Converters.Number, 'not-a-number'),
        (err) => err instanceof EnvaptError && err.code === EnvaptErrorCodes.FallbackConverterTypeMismatch
    );
}
