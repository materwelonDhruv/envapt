import assert from 'node:assert/strict';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

const resolveDir = dirname(fileURLToPath(import.meta.url));

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

let failures = 0;
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
        process.stdout.write(`consumer-build ${testCase.name}: OK (${output.length} bytes, node-free)\n`);
    } catch (err) {
        failures += 1;
        process.stderr.write(`consumer-build ${testCase.name}: FAIL\n`);
        process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    }
}

if (failures > 0) {
    process.stderr.write(`consumer-build: ${failures} bundle(s) pulled in node built-ins\n`);
    process.exit(1);
}
process.stdout.write('consumer-build: every resolved bundle is node-free\n');
