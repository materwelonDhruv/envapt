import assert from 'node:assert/strict';

import { FIXTURE_PATH } from './_helpers.mjs';
import { Converters, Envapter } from '../../../dist/node/index.mjs';

export default async function converters() {
    Envapter.envPaths = FIXTURE_PATH;

    const json = Envapter.getAs('JSON_KEY', Converters.Json);
    assert.deepEqual(json, { name: 'x', n: 1 });

    const url = Envapter.getAs('URL_KEY', Converters.Url);
    assert.ok(url instanceof URL);
    assert.equal(url.host, 'example.com');

    const date = Envapter.getAs('DATE_KEY', Converters.Date);
    assert.ok(date instanceof Date);
    assert.equal(date.toISOString(), '2025-01-01T00:00:00.000Z');

    const numbers = Envapter.getAs('ARRAY_NUMBERS', Converters.array({ of: Converters.Number, delimiter: ',' }));
    assert.deepEqual(numbers, [1, 2, 3]);
}
