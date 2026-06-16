import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// envapt's vitest suite transpiles with OXC and the only @-syntax static integration case runs on Deno
// (SWC). Both emit static decorators against the constructor and pass, so they never see this bug. tsc
// is the one emitter that puts a `declare static` decorator on the prototype, where a static read
// misses the getter, so only a real tsc compile-and-run surfaces it.
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const tsc = require.resolve('typescript/bin/tsc');

execFileSync('node', [tsc, '-p', join(here, 'tsconfig.json')], { stdio: 'inherit' });

const env = {
    ...process.env,
    TSC_EMIT_STATIC: '4321',
    TSC_EMIT_INSTANCE: 'from-env',
    TSC_EMIT_DECLARE_STATIC: '777'
};
const stdout = execFileSync('node', [join(here, 'out/fixture.mjs')], { env }).toString();
const reads =
    /** @type {{ staticValue: number; instanceValue: string; instanceNoDeclare?: string; declareStaticValue?: number }} */ (
        JSON.parse(stdout)
    );

assert.equal(
    reads.staticValue,
    Number(env.TSC_EMIT_STATIC),
    'plain `static readonly` decorated field must read the env value under tsc'
);
assert.equal(
    reads.instanceValue,
    env.TSC_EMIT_INSTANCE,
    '`declare readonly` instance field must read the env value under tsc'
);
assert.equal(
    reads.instanceNoDeclare,
    undefined,
    'a plain instance field (no `declare`) is shadowed by useDefineForClassFields, so `declare` is required on instance fields'
);
assert.equal(reads.declareStaticValue, undefined, '`declare static` stays broken under tsc (documented limitation)');

process.stdout.write('tsc-emit: all assertions passed\n');
