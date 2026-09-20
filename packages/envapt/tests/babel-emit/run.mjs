import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// jiti transforms through babel, whose legacy lowering redefines a decorated property after the
// decorator runs. only this suite covers it since tsc and esbuild leave that redefinition out.
const here = dirname(fileURLToPath(import.meta.url));

const env = { ...process.env, BABEL_EMIT_STATIC: '4321' };

const stdout = execFileSync('node', [join(here, 'load.mjs'), join(here, 'fixture.mts')], { env }).toString();
const reads = /** @type {{ staticValue: number; assignThrows: boolean }} */ (JSON.parse(stdout));

assert.equal(
    reads.staticValue,
    Number(env.BABEL_EMIT_STATIC),
    'a decorated `static readonly` field must read the env value under babel'
);
assert.equal(reads.assignThrows, true, 'a decorated field stays read-only after babel redefines it');

process.stdout.write('babel-emit: all assertions passed\n');
