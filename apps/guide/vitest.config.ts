import mdx from 'fumadocs-mdx/vite';
import { defineConfig } from 'vitest/config';

// source.config.ts reads this while the plugin loads it
process.env.TWOSLASH = '0';

export default defineConfig({
    plugins: [mdx()],
    resolve: { alias: { '@': import.meta.dirname } },
    test: {
        environment: 'node',
        coverage: { enabled: false },

        // date-only frontmatter renders a day early west of UTC so use a negative offset to catch it
        env: { TZ: 'America/New_York' }
    }
});
