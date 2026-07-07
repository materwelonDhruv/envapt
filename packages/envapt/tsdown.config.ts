import { defineConfig } from 'tsdown';

import type { UserConfig } from 'tsdown';

// es2022 is required for tree-shaking to work because NodeEnvapter's static block only
// tree-shakes with the native es2022 emit. unbundle keeps one module per file.
const shared = {
    unbundle: true,
    dts: true,
    clean: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    target: 'es2022'
} as const satisfies UserConfig;

// the portable build emits a sibling dts that the deep-import tests type-check against. package.json points published types at dist/types.
export default defineConfig([
    {
        ...shared,
        entry: { index: 'src/index.ts', config: 'src/config.ts', legacy: 'src/legacy.ts' },
        format: ['esm', 'cjs'],
        platform: 'node',
        outDir: 'dist/node'
    },
    // fixedExtension forces .mjs so the portable build matches its .mjs export paths.
    {
        ...shared,
        entry: { index: 'src/index.portable.ts', legacy: 'src/legacy.ts' },
        format: ['esm'],
        platform: 'neutral',
        shims: false,
        fixedExtension: true,
        outDir: 'dist/portable'
    },
    // Published types are emitted once without shims. emitDtsOnly drops JS.
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
