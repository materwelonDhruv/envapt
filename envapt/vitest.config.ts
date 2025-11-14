import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 500,
    globals: true,
    setupFiles: ['tests/setup-env.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: [['lcovonly', { file: 'lcov.info' }], ['html'], ['text']],
      include: ['src']
    }
  }
});
