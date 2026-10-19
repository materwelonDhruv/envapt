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

export type DocsPage = (typeof source)['$inferPage'];
export type BlogPage = (typeof blog)['$inferPage'];

// post dates are YYYY-MM-DD strings
export function blogPostsNewestFirst(): BlogPage[] {
    return blog.getPages().toSorted((a, b) => b.data.date.localeCompare(a.data.date));
}
