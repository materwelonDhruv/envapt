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
    }
]);
