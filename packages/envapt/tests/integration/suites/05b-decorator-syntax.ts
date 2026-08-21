import assert from 'node:assert/strict';

import { FIXTURE_PATH } from './_helpers.mjs';
import { Envapter } from '../../../dist/node/index.mjs';
import { Envapt } from '../../../dist/node/legacy.mjs';

// experimentalDecorators comes from deno.json and tsconfig.json in the parent directory
class Config {
    @Envapt('BASIC_KEY', { fallback: 'default' })
    static readonly BASIC_KEY: string;

    @Envapt('NUMBER_KEY', { fallback: 0, converter: Number })
    static readonly NUMBER_KEY: number;

    @Envapt('MISSING_DECORATOR_KEY', { fallback: 'fb-value' })
    static readonly MISSING_DECORATOR_KEY: string;
}

export default function decoratorSyntax(): void {
    Envapter.envPaths = FIXTURE_PATH;
    assert.equal(Config.BASIC_KEY, 'hello');
    assert.equal(Config.NUMBER_KEY, 42);
    assert.equal(Config.MISSING_DECORATOR_KEY, 'fb-value');
}
