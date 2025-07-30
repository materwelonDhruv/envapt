import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM build
  {
    entry: ['src/index.ts'],
    platform: 'node',
    format: ['esm'],
    skipNodeModulesBundle: true,
    target: 'es2022',
    clean: true,
    shims: true,
    cjsInterop: false,
    minify: false,
    splitting: false,
    keepNames: true,
    dts: true,
    sourcemap: true,
    treeshake: true,
    outDir: 'dist',
    outExtension: () => ({ js: '.mjs', dts: '.d.mts' })
  },
  // JS/CJS build
  {
    entry: ['src/index.ts'],
    platform: 'node',
    format: ['cjs'],
    skipNodeModulesBundle: true,
    target: 'es2022',
    clean: false,
    shims: true,
    cjsInterop: true,
    minify: false,
    splitting: false,
    keepNames: true,
    dts: true,
    sourcemap: true,
    treeshake: true,
    outDir: 'dist',
    outExtension: () => ({ js: '.js', dts: '.d.ts' })
  }
]);
