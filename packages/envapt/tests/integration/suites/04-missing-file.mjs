import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { FIXTURE_PATH } from './_helpers.mjs';
import { EnvaptError, EnvaptErrorCodes, Envapter } from '../../../dist/node/index.mjs';

export default async function missingFile() {
    const ghost = resolve(FIXTURE_PATH, '../this-fixture-does-not-exist.env');

    assert.throws(
        () => {
            Envapter.envPaths = ghost;
        },
        (err) => err instanceof EnvaptError && err.code === EnvaptErrorCodes.EnvFilesNotFound
    );

    Envapter.envPaths = FIXTURE_PATH;
    assert.equal(Envapter.get('BASIC_KEY'), 'hello');
}
