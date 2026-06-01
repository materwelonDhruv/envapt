import { rehypeCodeDefaultOptions, remarkNpm } from 'fumadocs-core/mdx-plugins';
import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';
import { z } from 'zod';

import { createSaltedTypesCache } from './lib/twoslash-cache';

export const docs = defineDocs({
    dir: 'content/docs',
    docs: {
        // enables page.data.getText('processed'), consumed by llms-full.txt
        postprocess: { includeProcessedMarkdown: true }
    }
});

export const blogPosts = defineDocs({
    dir: 'content/blog',
    docs: {
        schema: pageSchema.extend({
            author: z.string(),
            date: z.string()
        })
    }
});

// Twoslash's first compile per process builds a full TS env (~a minute against envapt's generics);
// every later edit reuses it and is sub-second. Always on for builds; opt out in dev with
// `TWOSLASH=0 pnpm dev` when iterating on layout rather than code samples.
// No typesCache: it does not invalidate when the in-repo `envapt` types are rebuilt, so it would
// serve stale hovers for the very library these docs describe.
const twoslashEnabled = process.env.TWOSLASH !== '0';

const PACKAGE_MANAGERS = [
    { name: 'pnpm', command: (cmd: string) => cmd.replace('npm install', 'pnpm add') },
    { name: 'npm', command: (cmd: string) => cmd },
    { name: 'yarn', command: (cmd: string) => cmd.replace('npm install', 'yarn add') },
    { name: 'bun', command: (cmd: string) => cmd.replace('npm install', 'bun add') },
    { name: 'deno', command: () => 'deno add jsr:@materwelon/envapt' }
];

export default defineConfig({
    mdxOptions: {
        remarkPlugins: [[remarkNpm, { persist: { id: 'package-manager' }, packageManagers: PACKAGE_MANAGERS }]],
        rehypeCodeOptions: {
            themes: { light: 'ayu-light', dark: 'ayu-dark' },
            transformers: [
                ...(rehypeCodeDefaultOptions.transformers ?? []),
                ...(twoslashEnabled
                    ? [
                          transformerTwoslash({
                              // `@Envapt` is a legacy decorator; type-check samples with the same
                              // setting as envapt's own tsconfig, or twoslash rejects them (TS 1206).
                              twoslashOptions: { compilerOptions: { experimentalDecorators: true } },
                              // Persist computed types to `.next/cache/twoslash` so only the first
                              // build pays the cold-compile cost (heavy with zod in the graph). The
                              // cache key is salted with envapt's dist hash so it self-busts on rebuild.
                              typesCache: createSaltedTypesCache()
                          })
                      ]
                    : [])
            ],
            langs: ['js', 'jsx', 'ts', 'tsx', 'bash', 'json', 'dotenv']
        }
    }
});
