import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts', 'src/config.ts'],
    unbundle: true, // keep true for better tree-shaking
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    platform: 'node',
    target: 'es2022',
    shims: true,
    fixedExtension: true,
    outDir: 'dist'
});
