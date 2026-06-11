import assert from 'node:assert/strict';

import { FIXTURE_PATH } from './_helpers.mjs';
import { Envapt, Envapter } from '../../../dist/node/index.mjs';

// Deno-only suite. Bun 1.3.10+ permanently emits Stage 3 decorators (bun#27575),
// incompatible with envapt's legacy install signature. Node has no native TS.
// Pairs with the runtime-helper test in 05-decorator.mjs.
class Config {
    @Envapt('BASIC_KEY', { fallback: 'default' })
    declare static readonly BASIC_KEY: string;

    @Envapt('NUMBER_KEY', { fallback: 0, converter: Number })
    declare static readonly NUMBER_KEY: number;

    @Envapt('MISSING_DECORATOR_KEY', { fallback: 'fb-value' })
    declare static readonly MISSING_DECORATOR_KEY: string;
}

export default function decoratorSyntax(): void {
    Envapter.envPaths = FIXTURE_PATH;
    assert.equal(Config.BASIC_KEY, 'hello');
    assert.equal(Config.NUMBER_KEY, 42);
    assert.equal(Config.MISSING_DECORATOR_KEY, 'fb-value');
}
