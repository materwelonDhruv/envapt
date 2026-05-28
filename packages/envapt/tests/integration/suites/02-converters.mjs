import assert from 'node:assert/strict';

import { FIXTURE_PATH } from './_helpers.mjs';
import { Converters, Envapter } from '../../../dist/index.mjs';

export default async function converters() {
    Envapter.envPaths = FIXTURE_PATH;

    assert.equal(Envapter.getNumber('NUMBER_KEY'), 42);
    assert.equal(Envapter.getBoolean('BOOL_KEY'), true);
    assert.equal(Envapter.getBigInt('BIGINT_KEY'), 9007199254740993n);

    const json = Envapter.getUsing('JSON_KEY', Converters.Json);
    assert.deepEqual(json, { name: 'x', n: 1 });

    const url = Envapter.getUsing('URL_KEY', Converters.Url);
    assert.ok(url instanceof URL);
    assert.equal(url.host, 'example.com');

    const date = Envapter.getUsing('DATE_KEY', Converters.Date);
    assert.ok(date instanceof Date);
    assert.equal(date.toISOString(), '2025-01-01T00:00:00.000Z');

    const numbers = Envapter.getUsing('ARRAY_NUMBERS', Converters.array({ of: Converters.Number, delimiter: ',' }));
    assert.deepEqual(numbers, [1, 2, 3]);
}
