import { loader } from 'fumadocs-core/source';

import { blogPosts, docs } from '@/.source/server';

export const source = loader({
    baseUrl: '/docs',
    source: docs.toFumadocsSource()
});

export const blog = loader({
    baseUrl: '/blog',
    source: blogPosts.toFumadocsSource()
});
