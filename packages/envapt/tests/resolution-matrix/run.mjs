// Build gate. Each (moduleResolution x condition) cell must resolve the right build and types, so a
// consumer on any runtime gets the matching surface. Run after build.
import { createRequire } from 'node:module';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

import { createGate } from '../_guard.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
// A probe path inside the package so node_modules resolution walks up to the workspace `envapt` symlink.
const probe = resolve(pkgDir, 'resolution-probe.mts');

const PORTABLE_CONDITIONS = ['workerd', 'edge-light', 'fastly', 'worker', 'browser', 'react-native'];
const TYPE_RESOLUTIONS = {
    Node16: ts.ModuleResolutionKind.Node16,
    NodeNext: ts.ModuleResolutionKind.NodeNext,
    Bundler: ts.ModuleResolutionKind.Bundler
};

const gate = createGate('resolution-matrix');

function moduleKindFor(resolution) {
    if (resolution === ts.ModuleResolutionKind.Node16) return ts.ModuleKind.Node16;
    if (resolution === ts.ModuleResolutionKind.NodeNext) return ts.ModuleKind.NodeNext;
    return ts.ModuleKind.ESNext;
}

function typesTarget(specifier, resolution, conditions) {
    const options = {
        moduleResolution: resolution,
        module: moduleKindFor(resolution),
        customConditions: conditions.length > 0 ? conditions : undefined
    };
    const resolved = ts.resolveModuleName(specifier, probe, options, ts.sys).resolvedModule?.resolvedFileName;
    return resolved ? basename(resolved) : undefined;
}

for (const [name, resolution] of Object.entries(TYPE_RESOLUTIONS)) {
    for (const condition of PORTABLE_CONDITIONS) {
        gate.check(
            `types ${name} envapt [${condition}]`,
            typesTarget('envapt', resolution, [condition]),
            'index.portable.d.mts'
        );
        gate.check(
            `types ${name} legacy [${condition}]`,
            typesTarget('envapt/legacy', resolution, [condition]),
            'legacy.d.mts'
        );
    }
    gate.check(`types ${name} envapt [deno]`, typesTarget('envapt', resolution, ['deno']), 'index.d.mts');
    gate.check(`types ${name} envapt []`, typesTarget('envapt', resolution, []), 'index.d.mts');
    gate.check(`types ${name} legacy [deno]`, typesTarget('envapt/legacy', resolution, ['deno']), 'legacy.d.mts');
    gate.check(`types ${name} legacy []`, typesTarget('envapt/legacy', resolution, []), 'legacy.d.mts');
}
// Node10 predates the exports map, so it always falls back to the top-level types field.
gate.check('types Node10 envapt []', typesTarget('envapt', ts.ModuleResolutionKind.Node10, []), 'index.d.mts');

// platform 'node' externalizes node:* builtins so the node-build cells bundle. Portable conditions
// still resolve the portable build because their keys precede `node` in the exports map (order wins).
async function buildDir(specifier, named, conditions) {
    const result = await esbuild.build({
        stdin: {
            contents: `import { ${named} } from '${specifier}';globalThis.__x = ${named};`,
            resolveDir: pkgDir,
            loader: 'js'
        },
        bundle: true,
        write: false,
        metafile: true,
        format: 'esm',
        platform: 'node',
        conditions,
        logLevel: 'silent'
    });
    const inputs = Object.keys(result.metafile.inputs);
    const dir = inputs.some((i) => i.includes('dist/portable/'))
        ? 'portable'
        : inputs.some((i) => i.includes('dist/node/'))
          ? 'node'
          : 'unknown';
    const nodeFree = !/["']node:[a-z]/.test(result.outputFiles[0].text);
    return { dir, nodeFree };
}

const JS_ENTRIES = [
    { specifier: 'envapt', named: 'Envapter' },
    { specifier: 'envapt/legacy', named: 'Envapt' }
];
for (const { specifier, named } of JS_ENTRIES) {
    for (const condition of PORTABLE_CONDITIONS) {
        const { dir, nodeFree } = await buildDir(specifier, named, [condition]);
        gate.check(`js ${specifier} [${condition}] build`, dir, 'portable');
        gate.check(`js ${specifier} [${condition}] node-free`, nodeFree, true);
    }
    gate.check(`js ${specifier} [deno] build`, (await buildDir(specifier, named, ['deno'])).dir, 'node');
    gate.check(`js ${specifier} [] build`, (await buildDir(specifier, named, [])).dir, 'node');
}

// A "No matching export" build error means the name is genuinely absent from the surface. Any other
// build error is a real failure, so rethrow it rather than reporting a false absence.
async function namedExportResolves(named, conditions) {
    try {
        await esbuild.build({
            stdin: {
                contents: `import { ${named} } from 'envapt';globalThis.__x = ${named};`,
                resolveDir: pkgDir,
                loader: 'js'
            },
            bundle: true,
            write: false,
            format: 'esm',
            platform: 'node',
            conditions,
            logLevel: 'silent'
        });
        return true;
    } catch (err) {
        if (err instanceof Error && err.message.includes('No matching export') && err.message.includes(named)) {
            return false;
        }
        throw err;
    }
}

for (const condition of PORTABLE_CONDITIONS) {
    gate.check(
        `discriminator NodeEnvSource [${condition}]`,
        await namedExportResolves('NodeEnvSource', [condition]),
        false
    );
}
gate.check('discriminator NodeEnvSource [deno]', await namedExportResolves('NodeEnvSource', ['deno']), true);
gate.check('discriminator NodeEnvSource []', await namedExportResolves('NodeEnvSource', []), true);

gate.done('every (moduleResolution x condition) cell resolved the right build and types.');
