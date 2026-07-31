import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        coverage: { enabled: false },

        // date-only frontmatter renders a day early west of UTC so use a negative offset to catch it
        env: { TZ: 'America/New_York' }
    }
});
