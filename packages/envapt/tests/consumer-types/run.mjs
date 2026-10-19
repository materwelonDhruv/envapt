// each config type-checks the built declarations the way a consumer project would. run after build.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createGate, resolveTsc } from '../_guard.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const { tsc, outDir } = resolveTsc(here);
const gate = createGate('consumer-types');

const BASE = {
    target: 'ES2022',
    module: 'esnext',
    moduleResolution: 'bundler',
    lib: ['ES2023'],
    types: ['node'],
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    isolatedModules: true
};

const NODE_FILES = ['readers.mts', 'modern-decorators.mts'];
const LEGACY_FILES = ['readers.mts', 'legacy/legacy-decorators.mts'];
const PORTABLE_FILES = ['portable.mts'];

const STRICT_FAMILY = [
    'strictNullChecks',
    'strictFunctionTypes',
    'noImplicitAny',
    'strictBindCallApply',
    'strictPropertyInitialization',
    'noImplicitThis',
    'useUnknownInCatchVariables',
    'strictBuiltinIteratorReturn'
];

const LEGACY = { experimentalDecorators: true };
const BROWSER = { customConditions: ['browser'], types: [], lib: ['ES2023', 'DOM'] };

const cases = [
    { name: 'baseline', files: NODE_FILES, options: {} },
    { name: 'strict off', files: NODE_FILES, options: { strict: false } },
    ...STRICT_FAMILY.map((flag) => ({ name: `${flag} off`, files: NODE_FILES, options: { [flag]: false } })),
    {
        name: 'extra strict flags',
        files: NODE_FILES,
        options: {
            exactOptionalPropertyTypes: true,
            noUncheckedIndexedAccess: true,
            noPropertyAccessFromIndexSignature: true
        }
    },
    { name: 'nodenext', files: NODE_FILES, options: { module: 'nodenext', moduleResolution: 'nodenext' } },
    { name: 'node16', files: NODE_FILES, options: { module: 'node16', moduleResolution: 'node16' } },
    { name: 'legacy', files: LEGACY_FILES, options: LEGACY },
    { name: 'legacy strict off', files: LEGACY_FILES, options: { ...LEGACY, strict: false } },
    {
        name: 'legacy exactOptionalPropertyTypes',
        files: LEGACY_FILES,
        options: { ...LEGACY, exactOptionalPropertyTypes: true }
    },
    {
        name: 'legacy nodenext',
        files: LEGACY_FILES,
        options: { ...LEGACY, module: 'nodenext', moduleResolution: 'nodenext' }
    },
    { name: 'browser', files: PORTABLE_FILES, options: BROWSER },
    { name: 'browser strict off', files: PORTABLE_FILES, options: { ...BROWSER, strict: false } },
    {
        name: 'workerd',
        files: PORTABLE_FILES,
        options: { customConditions: ['workerd'], types: ['@cloudflare/workers-types'], lib: ['ES2023'] }
    }
];

// tsc resolves `types` from the config's folder
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir);

for (const { name, files, options } of cases) {
    const configPath = join(outDir, `${name.replaceAll(' ', '-')}.json`);
    const config = {
        compilerOptions: { ...BASE, ...options },
        files: files.map((file) => join(here, 'fixtures', file))
    };
    writeFileSync(configPath, JSON.stringify(config));
    try {
        execFileSync('node', [tsc, '-p', configPath], { stdio: 'pipe' });
        gate.pass(`${name}: OK`);
    } catch (error) {
        gate.fail(`${name}\n${String(error.stdout).trim()}`);
    }
}

gate.done(`${cases.length} configs type-check`);
