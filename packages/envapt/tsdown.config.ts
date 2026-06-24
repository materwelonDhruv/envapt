import { defineConfig } from 'tsdown';

import type { UserConfig } from 'tsdown';

// es2022 is load-bearing: NodeEnvapter's static-block bind tree-shakes only with the native emit, so
// lowering the target would defeat it. unbundle keeps one module per source file for tree-shaking.
const shared = {
    unbundle: true,
    dts: true,
    clean: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    target: 'es2022'
} as const satisfies UserConfig;

// Each runtime build emits its own sibling dts so the deep-import tests resolve against the exact built
// JS. package.json points every `types` at the single dist/types tree below, not at these.
export default defineConfig([
    // shims injects __dirname/process for the node:* sources.
    {
        ...shared,
        entry: { index: 'src/index.ts', config: 'src/config.ts', legacy: 'src/legacy.ts' },
        format: ['esm', 'cjs'],
        platform: 'node',
        shims: true,
        outDir: 'dist/node'
    },
    // fixedExtension forces .mjs (it only defaults on for platform:node).
    {
        ...shared,
        entry: { index: 'src/workerd.ts', legacy: 'src/legacy.ts' },
        format: ['esm'],
        platform: 'neutral',
        shims: false,
        fixedExtension: true,
        outDir: 'dist/workerd'
    },
    {
        ...shared,
        entry: { index: 'src/browser.ts', legacy: 'src/legacy.ts' },
        format: ['esm'],
        platform: 'browser',
        shims: false,
        fixedExtension: true,
        outDir: 'dist/browser'
    },
    // The published types, emitted once and shims-free so no entry carries a node:* banner and every
    // entry shares one declaration (one auto-import per name, not one per runtime build). emitDtsOnly
    // drops the JS. esm-only avoids a second cjs bundle here.
    {
        ...shared,
        dts: { emitDtsOnly: true },
        entry: {
            index: 'src/index.ts',
            'index.portable': 'src/index.portable.ts',
            config: 'src/config.ts',
            legacy: 'src/legacy.ts'
        },
        format: ['esm'],
        platform: 'neutral',
        shims: false,
        fixedExtension: true,
        outDir: 'dist/types'
    }
]);
