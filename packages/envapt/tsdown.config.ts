import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
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
