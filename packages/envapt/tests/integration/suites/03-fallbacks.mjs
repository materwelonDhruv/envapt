import assert from 'node:assert/strict';

import { FIXTURE_PATH } from './_helpers.mjs';
import { Converters, EnvaptError, EnvaptErrorCodes, Envapter } from '../../../dist/node/index.mjs';

export default async function fallbacks() {
    Envapter.envPaths = FIXTURE_PATH;

    assert.equal(Envapter.get('MISSING_KEY', 'default'), 'default');

    // a fallback that does not match the converter throws even when the key is missing
    assert.throws(
        () => Envapter.getAs('MISSING_KEY', Converters.Number, 'not-a-number'),
        (err) => err instanceof EnvaptError && err.code === EnvaptErrorCodes.FallbackConverterTypeMismatch
    );
}
