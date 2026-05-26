import { defineConfig } from 'tsdown';

// envapt is ESM-only as of v5. Single dist/index.mjs + dist/index.d.ts.
export default defineConfig({
    entry: ['src/index.ts'],
    format: 'esm',
    dts: true,
    clean: true,
    treeshake: true,
    sourcemap: true,
    platform: 'node',
    target: 'es2022',
    shims: true,
    fixedExtension: true,
    outDir: 'dist'
});
