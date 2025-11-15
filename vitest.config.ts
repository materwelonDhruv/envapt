import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    testTimeout: 500,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: [['lcovonly', { file: 'lcov.info' }], ['html'], ['text']],
      include: ['src']
    }
  },
  resolve: {
    alias: {
      // Permet à Vitest/Vite de résoudre `import "envapt"` à partir des sources locales
      envapt: path.resolve(__dirname, 'src')
    }
  }
});
