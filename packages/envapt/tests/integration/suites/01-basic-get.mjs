import assert from 'node:assert/strict';

import { FIXTURE_PATH } from './_helpers.mjs';
import { Envapter } from '../../../dist/node/index.mjs';

export default async function basicGet() {
    Envapter.envPaths = FIXTURE_PATH;

    assert.equal(Envapter.get('BASIC_KEY'), 'hello');
    assert.equal(Envapter.get('TEMPLATED_KEY'), 'greeting-hello');
    assert.equal(Envapter.get('MISSING_KEY'), undefined);

    const instance = new Envapter();
    assert.equal(instance.getRaw('BASIC_KEY'), 'hello');
    assert.equal(instance.getRaw('MISSING_KEY'), undefined);
}
