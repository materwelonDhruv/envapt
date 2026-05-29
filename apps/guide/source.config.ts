import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';

export const docs = defineDocs({
    dir: 'content/docs',
    docs: {
        // enables page.data.getText('processed'), consumed by llms-full.txt
        postprocess: { includeProcessedMarkdown: true }
    }
});

// Twoslash's first compile per process builds a full TS env (~a minute against envapt's generics);
// every later edit reuses it and is sub-second. Always on for builds; opt out in dev with
// `TWOSLASH=0 pnpm dev` when iterating on layout rather than code samples.
// No typesCache: it does not invalidate when the in-repo `envapt` types are rebuilt, so it would
// serve stale hovers for the very library these docs describe.
const twoslashEnabled = process.env.TWOSLASH !== '0';

export default defineConfig({
    mdxOptions: {
        rehypeCodeOptions: {
            themes: { light: 'ayu-light', dark: 'ayu-dark' },
            transformers: [
                ...(rehypeCodeDefaultOptions.transformers ?? []),
                ...(twoslashEnabled ? [transformerTwoslash()] : [])
            ],
            langs: ['js', 'jsx', 'ts', 'tsx', 'bash', 'json', 'dotenv']
        }
    }
});
