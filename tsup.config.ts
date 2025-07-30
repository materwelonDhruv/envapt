import { defineConfig } from 'tsup';

import type { Options } from 'tsup';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, complexity
function createTsupConfig({
  format = ['esm', 'cjs'],
  entry = ['src/index.ts'],
  dts = true,
  shims = true,
  skipNodeModulesBundle = true,
  clean = true,

  treeshake = true,
  platform = 'node',
  target = 'es2022',
  splitting = false,
  cjsInterop = format.includes('cjs'),
  minify = false,
  keepNames = true,
  sourcemap = true,
  outDir = 'dist',
  outExtension = ({ format }) => {
    return { js: `.${format === 'esm' ? 'mjs' : 'js'}`, dts: '.d.ts' };
  }
}: Options = {}) {
  return defineConfig({
    format,
    entry,
    dts,
    shims,
    skipNodeModulesBundle,
    clean,

    platform,
    target,
    cjsInterop,
    minify,
    splitting,
    keepNames,
    sourcemap,
    treeshake,
    outDir,
    outExtension
  });
}

export default createTsupConfig();
