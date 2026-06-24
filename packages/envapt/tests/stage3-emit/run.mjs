/* eslint-disable no-magic-numbers */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Modern (TC39 Stage 3) accessor decorators need a real compiler emit. node runs a tsc compile with
// experimentalDecorators off. bun and deno run the source directly so each exercises its own Stage 3
// transform, so a green run proves Bun's old "ignores decorators" issue does not apply to the modern
// form. vitest's oxc transform leaves the accessor `context.name` unset, so it cannot run this.
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const tsc = require.resolve('typescript/bin/tsc');

execFileSync('node', [tsc, '-p', join(here, 'tsconfig.json')], { stdio: 'inherit' });

const env = {
    ...process.env,
    S3_PORT: '8080',
    S3_REGION: 'eu-west-1',
    S3_DEBUG: 'true',
    S3_URL: 'https://app.example.com',
    S3_TTL: '15m',
    S3_BIG: '9007199254740993',
    S3_TAGS: 'alpha,beta,gamma',
    S3_GREETING: 'Hello ${S3_REGION}'
    // S3_MISSING and S3_ABSENT_REQUIRED are intentionally absent
};

const out = join(here, 'out/fixture.mjs');
const source = join(here, 'fixture.mts');

/** @param {Record<string, unknown>} reads @param {string} runtime */
function assertReads(reads, runtime) {
    assert.equal(reads.port, 8080, `${runtime}: static accessor resolves the env number`);
    assert.equal(reads.region, 'eu-west-1', `${runtime}: instance accessor resolves the env string`);
    assert.equal(reads.debug, true, `${runtime}: boolean converter`);
    assert.equal(reads.url, 'https://app.example.com/', `${runtime}: url converter`);
    assert.equal(reads.ttl, 900000, `${runtime}: time converter (15m -> 900000)`);
    assert.equal(reads.big, '9007199254740993', `${runtime}: bigint converter`);
    assert.deepEqual(reads.tags, ['alpha', 'beta', 'gamma'], `${runtime}: array converter`);
    assert.equal(reads.fallbackValue, 1234, `${runtime}: fallback when the env var is absent`);
    assert.equal(reads.multiKey, 8080, `${runtime}: multi-key falls through to the second key`);
    assert.equal(reads.greeting, 'Hello eu-west-1', `${runtime}: template variable resolution`);
    assert.equal(reads.schemaPort, 8080, `${runtime}: standard schema validates and returns the output`);
    assert.equal(reads.noFallback, null, `${runtime}: no-fallback sugar resolves to null`);
    assert.equal(reads.inheritedRegion, 'eu-west-1', `${runtime}: subclass reads the inherited instance accessor`);
    assert.equal(reads.collisionA, 8080, `${runtime}: first of two same-named classes`);
    assert.equal(reads.collisionB, 4321, `${runtime}: second same-named class resolves independently`);
    assert.equal(reads.readOnlyThrew, true, `${runtime}: assignment throws (read-only)`);
    assert.equal(reads.requiredThrew, true, `${runtime}: required throws when the value is absent`);
}

// node is the hard requirement (tsc emit). bun and deno run the source directly with their own Stage 3
// transforms when present. Only a missing binary (ENOENT) is skipped. A present runtime that crashes
// or returns a wrong value fails the suite, so a real Bun/Deno decorator regression is caught.
const optional = ['bun', 'deno'];
const reads = JSON.parse(execFileSync('node', [out], { env }).toString());
assertReads(reads, 'node');
process.stdout.write('stage3-emit: node ok\n');

const ran = ['node'];
for (const runtime of optional) {
    let stdout;
    try {
        const args = runtime === 'deno' ? ['run', '-A', source] : [source];
        stdout = execFileSync(runtime, args, { env }).toString();
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            process.stdout.write(`stage3-emit: ${runtime} skipped (not installed)\n`);
            continue;
        }
        throw error;
    }
    assertReads(JSON.parse(stdout), runtime);
    ran.push(runtime);
    process.stdout.write(`stage3-emit: ${runtime} ok\n`);
}

process.stdout.write(`stage3-emit: all assertions passed (${ran.join(', ')})\n`);
