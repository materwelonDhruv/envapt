import assert from 'node:assert/strict';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

const resolveDir = dirname(fileURLToPath(import.meta.url));

// A leaf import that touches none of the reader machinery. If the entry is side-effect-free the bundler
// drops the whole Envapter graph, leaving only the error type.
const leafProgram = (specifier) => `import { EnvaptError } from '${specifier}';globalThis.__envapt = EnvaptError;`;

// Markers for code that must NOT survive a leaf import, a converter body and the Standard Schema dispatch.
const HEAVY_MARKERS = [/new URL\(/, /~standard/, /JSON\.parse/];
const MAX_LEAF_BYTES = 4000;

const cases = [
    { name: 'envapt/browser leaf', specifier: 'envapt/browser', platform: 'browser', conditions: [] },
    { name: 'envapt/workerd leaf', specifier: 'envapt/workerd', platform: 'neutral', conditions: ['workerd'] },
    { name: 'envapt leaf (browser)', specifier: 'envapt', platform: 'browser', conditions: [] },
    { name: 'envapt leaf (workerd)', specifier: 'envapt', platform: 'neutral', conditions: ['workerd'] }
];

let failures = 0;
for (const testCase of cases) {
    try {
        const result = await esbuild.build({
            stdin: { contents: leafProgram(testCase.specifier), resolveDir, loader: 'js' },
            bundle: true,
            write: false,
            minify: true,
            format: 'esm',
            platform: testCase.platform,
            conditions: testCase.conditions,
            logLevel: 'silent'
        });
        const output = result.outputFiles[0].text;
        for (const marker of HEAVY_MARKERS) {
            assert.ok(!marker.test(output), `${testCase.name}: leaf bundle retained ${marker} (graph not tree-shaken)`);
        }
        assert.ok(
            output.length < MAX_LEAF_BYTES,
            `${testCase.name}: leaf bundle is ${output.length} bytes, expected < ${MAX_LEAF_BYTES}`
        );
        process.stdout.write(`tree-shaking ${testCase.name}: OK (${output.length} bytes)\n`);
    } catch (err) {
        failures += 1;
        process.stderr.write(`tree-shaking ${testCase.name}: FAIL\n`);
        process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    }
}

if (failures > 0) {
    process.stderr.write(`tree-shaking: ${failures} portable entry/entries do not tree-shake a leaf import\n`);
    process.exit(1);
}
process.stdout.write('tree-shaking: every portable leaf import tree-shakes the Envapter graph\n');
