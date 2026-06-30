import assert from 'node:assert/strict';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

import { createGate } from '../_guard.mjs';

const resolveDir = dirname(fileURLToPath(import.meta.url));
const gate = createGate('consumer-build');

const program = (specifier) =>
    `import { Envapter, WorkerEnvSource, ManualEnvSource, Converters } from '${specifier}';` +
    `globalThis.__envapt = [Envapter, WorkerEnvSource, ManualEnvSource, Converters];`;

// the browser/neutral platform makes esbuild fail the build on any unresolved node built-in, so a
// clean build proves the resolved bundle is node-free, the output check below is a backup
const cases = [
    { name: "import 'envapt' (browser)", specifier: 'envapt', platform: 'browser', conditions: [] },
    { name: "import 'envapt' (workerd)", specifier: 'envapt', platform: 'neutral', conditions: ['workerd'] },
    { name: "import 'envapt' (edge-light)", specifier: 'envapt', platform: 'neutral', conditions: ['edge-light'] },
    { name: "import 'envapt' (fastly)", specifier: 'envapt', platform: 'neutral', conditions: ['fastly'] },
    { name: "import 'envapt' (worker)", specifier: 'envapt', platform: 'neutral', conditions: ['worker'] },
    { name: "import 'envapt' (react-native)", specifier: 'envapt', platform: 'neutral', conditions: ['react-native'] }
];

for (const testCase of cases) {
    try {
        const result = await esbuild.build({
            stdin: { contents: program(testCase.specifier), resolveDir, loader: 'js' },
            bundle: true,
            write: false,
            format: 'esm',
            platform: testCase.platform,
            conditions: testCase.conditions,
            logLevel: 'silent'
        });
        const output = result.outputFiles[0].text;
        assert.ok(!/["']node:[a-z]/.test(output), `${testCase.name}: bundle contains a node: specifier`);
        gate.pass(`${testCase.name}: OK (${output.length} bytes, node-free)`);
    } catch (err) {
        gate.fail(`${testCase.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
}

gate.done('every resolved bundle is node-free');
