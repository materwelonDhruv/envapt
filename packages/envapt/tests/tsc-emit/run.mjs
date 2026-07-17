import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { resolveTsc } from '../_guard.mjs';

// envapt's vitest suite transpiles with OXC and the only @-syntax static integration case runs on Deno
// (SWC). Both emit static decorators against the constructor and pass, so they never see this split.
// tsc 6 puts a `declare static` decorator on the prototype, where a static read misses the getter.
// tsgo (typescript7) puts it on the constructor and the read resolves. Only a real compile-and-run
// surfaces either behavior.
const here = dirname(fileURLToPath(import.meta.url));
const { tsc, outDir } = resolveTsc(here);

execFileSync('node', [tsc, '-p', join(here, 'tsconfig.json'), '--outDir', outDir], { stdio: 'inherit' });

const env = {
    ...process.env,
    TSC_EMIT_STATIC: '4321',
    TSC_EMIT_INSTANCE: 'from-env',
    TSC_EMIT_DECLARE_STATIC: '777'
};
const stdout = execFileSync('node', [join(outDir, 'fixture.mjs')], { env }).toString();
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
// tsc 6 applies the `declare static` decorator to the prototype, tsgo (typescript7) to the constructor
assert.equal(
    reads.declareStaticValue,
    process.env.ENVAPT_TSC_PACKAGE === 'typescript7' ? Number(env.TSC_EMIT_DECLARE_STATIC) : undefined,
    '`declare static` resolves under tsgo and reads undefined under tsc 6'
);

process.stdout.write('tsc-emit: all assertions passed\n');
