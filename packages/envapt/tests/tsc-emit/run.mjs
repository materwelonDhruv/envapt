import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { resolveTsc } from '../_guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const { tsc, outDir } = resolveTsc(here);

execFileSync('node', [tsc, '-p', join(here, 'tsconfig.json'), '--outDir', outDir], { stdio: 'inherit' });

const env = {
    ...process.env,
    TSC_EMIT_STATIC: '4321',
    TSC_EMIT_INSTANCE: 'from-env'
};
const stdout = execFileSync('node', [join(outDir, 'fixture.mjs')], { env }).toString();
const reads = /** @type {{ staticValue: number; instanceValue: string }} */ (JSON.parse(stdout));

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

process.stdout.write('tsc-emit: all assertions passed\n');
