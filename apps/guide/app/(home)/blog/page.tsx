import Link from 'next/link';

import { formatDate } from '@/lib/date';
import { pageMetadata } from '@/lib/metadata';
import { DEFAULT_OG } from '@/lib/og/images';
import { SITE_NAME } from '@/lib/site';
import { blogPostsNewestFirst } from '@/lib/source';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = pageMetadata({
    title: 'Blog',
    description: `Release notes and tutorials from the ${SITE_NAME} project.`,
    path: '/blog',
    image: DEFAULT_OG,
    type: 'website'
});

export default function BlogIndex(): ReactNode {
    const posts = blogPostsNewestFirst();

    return (
        <main className="mx-auto w-full max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-semibold">Blog</h1>
            <p className="mt-2 text-fd-muted-foreground">Release notes and tutorials from the {SITE_NAME} project.</p>
            <ul className="mt-10 flex flex-col gap-8">
                {posts.map((post) => (
                    <li key={post.url}>
                        <Link href={post.url} className="group block">
                            <time className="font-mono text-sm text-fd-muted-foreground">
                                {formatDate(post.data.date)}
                            </time>
                            {post.data.updated !== post.data.date && (
                                <span className="font-mono text-sm text-fd-muted-foreground">
                                    {' '}
                                    · updated {formatDate(post.data.updated)}
                                </span>
                            )}
                            <h2 className="mt-1 text-xl font-medium group-hover:text-fd-primary">{post.data.title}</h2>
                            <p className="mt-1 text-fd-muted-foreground">{post.data.description}</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
