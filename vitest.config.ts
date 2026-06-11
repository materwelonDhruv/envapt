import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        testTimeout: 500,
        // workers, browser, and consumer-build run on their own runtimes via dedicated configs, never the node pool
        exclude: [...configDefaults.exclude, '**/tests/{workers,browser,consumer-build}/**'],
        // absolute so it resolves whether vitest's root is the package dir (CLI) or the repo root (IDE runner)
        setupFiles: [resolve(configDir, 'packages/envapt/tests/setup.ts')],
        coverage: {
            enabled: true,
            provider: 'v8',
            reporter: [['lcovonly', { file: 'lcov.info' }], ['html'], ['text']],
            include: ['src']
        }
    }
});
