import { defineConfig } from 'tsdown';

import type { UserConfig } from 'tsdown';

const shared = {
    unbundle: true,
    // the browser and workers tests type-check against the portable build's dts
    dts: true,
    clean: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    target: 'es2022'
} as const satisfies UserConfig;

export default defineConfig([
    {
        ...shared,
        entry: { index: 'src/index.ts', config: 'src/config.ts', legacy: 'src/legacy.node.ts' },
        format: ['esm'],
        platform: 'node',
        outDir: 'dist/node'
    },
    // fixedExtension forces .mjs to match the portable export paths
    {
        ...shared,
        entry: { index: 'src/index.portable.ts', legacy: 'src/legacy.ts' },
        format: ['esm'],
        platform: 'neutral',
        shims: false,
        fixedExtension: true,
        outDir: 'dist/portable'
    },
    // every export in package.json takes its types from this build
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
