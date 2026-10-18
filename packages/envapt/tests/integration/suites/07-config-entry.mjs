import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(HERE, '../config-entry');

// envapt/config only runs on the first import in a process
function printMirroredKeys(script) {
    const isDeno = typeof Deno !== 'undefined';
    const command = isDeno ? Deno.execPath() : process.execPath;
    const args = isDeno ? ['run', '-A', script] : [script];
    const child = spawnSync(command, args, { cwd: FIXTURE_DIR, encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
    return JSON.parse(child.stdout);
}

export default async function configEntry() {
    assert.deepEqual(printMirroredKeys(resolve(FIXTURE_DIR, 'print.mjs')), ['alpha', 'alpha-beta']);
}
