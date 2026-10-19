import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

import { createGate } from '../_guard.mjs';

const resolveDir = dirname(fileURLToPath(import.meta.url));
const gate = createGate('consumer-build');

const program = (specifier) =>
    `import { Envapter, PortableSource, Converters } from '${specifier}';` +
    `globalThis.__envapt = [Envapter, PortableSource, Converters];`;

// esbuild fails a browser or neutral build on any node built-in it cannot resolve
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

// a node bundle that only uses decorators still reads process.env
const CONSUMER_PORT = 4000;
const decoratorProgram = `
import { Converters, Envapt } from 'envapt';
class Config {
    @Envapt('ENVAPT_CONSUMER_PORT', { converter: Converters.Port, fallback: 3000 })
    static accessor port: number;
}
globalThis.__envaptPort = Config.port;
`;

try {
    const result = await esbuild.build({
        stdin: { contents: decoratorProgram, resolveDir, loader: 'ts' },
        bundle: true,
        write: false,
        format: 'esm',
        platform: 'node',
        target: 'node22',
        tsconfigRaw: {},
        logLevel: 'silent'
    });
    process.env.ENVAPT_CONSUMER_PORT = String(CONSUMER_PORT);
    await import(`data:text/javascript,${encodeURIComponent(result.outputFiles[0].text)}`);
    assert.equal(globalThis.__envaptPort, CONSUMER_PORT, 'decorator read the fallback or threw');
    gate.pass("decorators-only 'envapt' (node): OK");
} catch (err) {
    gate.fail(`decorators-only 'envapt' (node): ${err instanceof Error ? err.message : String(err)}`);
}

// every node entry keeps the FileSource bind when it is the only import
const pkg = JSON.parse(readFileSync(resolve(resolveDir, '../../package.json'), 'utf8'));
const nodeSubpaths = Object.keys(pkg.exports).filter((subpath) => pkg.exports[subpath].node);

for (const subpath of nodeSubpaths) {
    const specifier = subpath === '.' ? 'envapt' : `envapt/${subpath.slice(2)}`;
    // esbuild drops a bare `import 'envapt'` because index.mjs has no side effects of its own
    const entryProgram = `import * as entry from '${specifier}';globalThis.__envapt = entry;`;
    try {
        const result = await esbuild.build({
            stdin: { contents: entryProgram, resolveDir, loader: 'js' },
            bundle: true,
            write: false,
            format: 'esm',
            platform: 'node',
            logLevel: 'silent'
        });
        const child = spawnSync(process.execPath, ['--input-type=module'], {
            input: result.outputFiles[0].text,
            env: { ...process.env, ENVAPT_DEBUG: 'verbose' },
            encoding: 'utf8'
        });
        assert.equal(child.status, 0, child.stderr);
        assert.match(child.stderr, /\[envapt\]/, 'importing the entry bound no source');
        gate.pass(`import '${specifier}' alone (node) keeps the FileSource bind`);
    } catch (err) {
        gate.fail(`import '${specifier}' alone (node): ${err instanceof Error ? err.message : String(err)}`);
    }
}

gate.done('every resolved bundle is node-free, and every node entry binds FileSource');
