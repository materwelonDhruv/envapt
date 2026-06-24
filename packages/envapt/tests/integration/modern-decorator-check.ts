import assert from 'node:assert/strict';
import process from 'node:process';

import { Converters, Envapt, EnvBool, EnvNum } from '../../dist/node/index.mjs';

// excluded from tc and eslint, both run experimentalDecorators which rejects the accessor form. bun and
// deno transpile this with their native Stage 3, so running it on each verifies the modern decorators there.
class Config {
    @EnvNum('MD_PORT_ABSENT', 3000)
    static accessor port: number;

    @Envapt('MD_REGION_ABSENT', { fallback: 'us-east-1' })
    static accessor region: string;

    @Envapt('MD_TAGS_ABSENT', { converter: Converters.array({ of: Converters.String }), fallback: ['a', 'b'] })
    static accessor tags: string[];

    @EnvBool('MD_NO_FALLBACK_ABSENT')
    static accessor missing: boolean | null;
}

const runtime = typeof Deno !== 'undefined' ? 'deno' : typeof Bun !== 'undefined' ? 'bun' : 'node';

assert.equal(Config.port, 3000, `${runtime}: number fallback via static accessor`);
assert.equal(Config.region, 'us-east-1', `${runtime}: string fallback via static accessor`);
assert.deepEqual(Config.tags, ['a', 'b'], `${runtime}: array fallback via static accessor`);
assert.equal(Config.missing, null, `${runtime}: no-fallback resolves to null`);

let readOnlyThrew = false;
try {
    (Config as { port: number }).port = 999;
} catch {
    readOnlyThrew = true;
}
assert.equal(readOnlyThrew, true, `${runtime}: assigning to a decorated property throws`);

process.stdout.write(`modern-decorator-check: ${runtime} ok\n`);
