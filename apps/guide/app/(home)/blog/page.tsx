import Link from 'next/link';

import { canonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';
import { blog } from '@/lib/source';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Next.js replaces (not deep-merges) the root layout's openGraph when a route sets its own,
// so the full block is redeclared here to keep og:url pointing at /blog instead of the homepage.
export const metadata: Metadata = {
    title: 'Blog',
    description: `Release notes and tutorials from the ${SITE_NAME} project.`,
    alternates: { canonical: canonicalUrl('/blog') },
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        url: canonicalUrl('/blog'),
        locale: 'en_US',
        images: DEFAULT_OG_IMAGE
    }
};

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogIndex(): ReactNode {
    const posts = blog.getPages().toSorted((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

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
