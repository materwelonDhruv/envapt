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

export default defineConfig({
    mdxOptions: {
        rehypeCodeOptions: {
            themes: { light: 'ayu-light', dark: 'ayu-dark' },
            transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), transformerTwoslash()],
            langs: ['js', 'jsx', 'ts', 'tsx', 'bash', 'json', 'dotenv']
        }
    }
});
