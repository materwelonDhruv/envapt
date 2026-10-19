import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EnvaptErrorCodes } from 'envapt';
import * as esbuild from 'esbuild';
import webpack from 'webpack';

import { createGate } from '../_guard.mjs';

const resolveDir = dirname(fileURLToPath(import.meta.url));
const gate = createGate('tree-shaking');

// importing only EnvaptError should let the bundler drop the whole Envapter graph
const leafProgram = (specifier) => `import { EnvaptError } from '${specifier}';globalThis.__envapt = EnvaptError;`;

// a converter body and the Standard Schema check must not survive a leaf import
const HEAVY_MARKERS = [/new URL\(/, /~standard/, /JSON\.parse/];
const MAX_LEAF_BYTES = 4000;

const cases = [
    { name: 'envapt leaf (browser)', specifier: 'envapt', platform: 'browser', conditions: [] },
    { name: 'envapt leaf (workerd)', specifier: 'envapt', platform: 'neutral', conditions: ['workerd'] }
];

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
        gate.pass(`${testCase.name}: OK (${output.length} bytes)`);
    } catch (err) {
        gate.fail(`${testCase.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
}

// webpack and Next's Turbopack skip a side-effect-free barrel and import its re-exports directly.
// That skips the barrel's bare import of bindNodeDefaults. esbuild runs the import either way.
function bundleWithWebpack(outDir) {
    return new Promise((resolve, reject) => {
        webpack(
            {
                mode: 'production',
                target: 'node',
                entry: join(resolveDir, 'node-bind.entry.mjs'),
                output: { path: outDir, filename: 'bundle.cjs' }
            },
            (err, stats) => {
                if (err) reject(err);
                else if (stats.hasErrors()) reject(new Error(stats.toString('errors-only')));
                else resolve(join(outDir, 'bundle.cjs'));
            }
        );
    });
}

const outDir = mkdtempSync(join(tmpdir(), 'envapt-webpack-'));
try {
    const bundle = await bundleWithWebpack(outDir);
    createRequire(import.meta.url)(bundle);
    // NoSourceBound means the bundle skipped the FileSource bind
    gate.check('webpack node bundle binds FileSource', globalThis.__envaptCode, EnvaptErrorCodes.MissingEnvValue);
} catch (err) {
    gate.fail(`webpack node bundle: ${err instanceof Error ? err.message : String(err)}`);
} finally {
    rmSync(outDir, { recursive: true, force: true });
}

gate.done('every portable leaf import tree-shakes the Envapter graph, and a bundled node import binds FileSource');
