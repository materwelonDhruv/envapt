import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        cloudflareTest({
            miniflare: {
                compatibilityDate: '2024-09-23',
                compatibilityFlags: [],
                bindings: {
                    APP_NAME: 'envapt',
                    PORT: '8787',
                    DEBUG: 'true',
                    API_URL: 'https://api.example.com/v1',
                    FEATURES: '{"beta":true}',
                    GREETING: 'Hello ${APP_NAME}',
                    TAGS: 'a,b,c',
                    TIMEOUT: '1.5h'
                }
            }
        })
    ],
    test: {
        include: ['tests/workers/**/*.test.ts'],
        coverage: { enabled: false }
    }
});
