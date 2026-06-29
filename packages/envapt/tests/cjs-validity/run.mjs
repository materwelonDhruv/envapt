// Build gate. Every emitted `.cjs` must parse and `require()` as CommonJS. ESM syntax leaking into a
// `.cjs` (a `shims`/banner regression) still loads as ESM, so the runtime builds pass while every
// `require('envapt')` consumer breaks.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const nodeDist = resolve(here, '..', '..', 'dist', 'node');
const require = createRequire(import.meta.url);

const cjsFiles = readdirSync(nodeDist, { recursive: true }).filter((name) => name.endsWith('.cjs'));
assert.ok(cjsFiles.length > 0, `no .cjs files under ${nodeDist} (build first?)`);

let failures = 0;

// `.cjs` forces Node's CommonJS parser, so a top-level `import`/`import.meta` is a SyntaxError here.
for (const name of cjsFiles) {
    const file = join(nodeDist, name);
    try {
        execFileSync('node', ['--check', file], { stdio: 'pipe' });
    } catch (err) {
        failures += 1;
        process.stderr.write(`cjs-validity: ${name} is not valid CommonJS\n`);
        process.stderr.write(`${err instanceof Error && err.stderr ? err.stderr.toString() : String(err)}\n`);
    }
}

// --check is syntax-only, so also load each entry the way a consumer does to prove the graph resolves
const entries = [
    { file: 'index.cjs', expect: ['Envapter', 'Envapt', 'Converters', 'EnvaptError'] },
    { file: 'legacy.cjs', expect: ['Envapt', 'EnvNum'] },
    { file: 'config.cjs', expect: [] }
];
for (const { file, expect } of entries) {
    try {
        // eslint-disable-next-line security/detect-non-literal-require -- loading built CJS entries by path is this gate's job
        const loaded = require(join(nodeDist, file));
        for (const name of expect) {
            assert.ok(name in loaded, `${file}: missing export "${name}"`);
        }
        process.stdout.write(`cjs-validity: require('${file}') OK\n`);
    } catch (err) {
        failures += 1;
        process.stderr.write(`cjs-validity: require('${file}') threw\n`);
        process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    }
}

if (failures > 0) {
    process.stderr.write(`cjs-validity: ${failures} check(s) failed\n`);
    process.exit(1);
}
process.stdout.write(`cjs-validity: ${cjsFiles.length} .cjs files valid, all CJS entries require cleanly\n`);
