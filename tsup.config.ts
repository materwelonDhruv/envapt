import { defineConfig } from 'tsup';

import type { Options } from 'tsup';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, complexity
function createTsupConfig({
  format = ['esm', 'cjs'],
  entry = ['src/index.ts'],
  dts = true,
  shims = true,
  skipNodeModulesBundle = true,
  treeshake = true,
  platform = 'node',
  target = 'es2022',
  clean = true,
  splitting = false,
  cjsInterop = format.includes('cjs'),
  minify = false,
  keepNames = true,
  sourcemap = true,
  outDir = 'dist',
  outExtension = ({ format }) => {
    return { js: `.${format === 'esm' ? 'mjs' : 'js'}`, dts: `.${format === 'esm' ? 'd.mts' : 'd.ts'}` };
  }
}: Options = {}) {
  return defineConfig({
    entry,
    platform,
    format,
    skipNodeModulesBundle,
    target,
    clean,
    shims,
    cjsInterop,
    minify,
    splitting,
    keepNames,
    dts,
    sourcemap,
    treeshake,
    outDir,
    outExtension
  });
}

export default createTsupConfig();
