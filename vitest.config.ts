import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        testTimeout: 500,
        // workers, browser, and the guide have their own vitest configs. consumer-build is a node script
        exclude: [...configDefaults.exclude, '**/tests/{workers,browser,consumer-build}/**', 'apps/**'],
        // absolute so it resolves whether vitest's root is the package dir (CLI) or the repo root (IDE runner)
        setupFiles: [resolve(configDir, 'packages/envapt/tests/setup.ts')],
        coverage: {
            enabled: true,
            provider: 'v8',
            reporter: [['lcovonly', { file: 'lcov.info' }], ['html'], ['text']],
            // the codecov workflow uploads coverage/lcov.info from the repo root
            reportsDirectory: resolve(configDir, 'coverage'),
            include: ['src']
        }
    }
});
