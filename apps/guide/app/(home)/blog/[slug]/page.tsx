import { DocsBody } from 'fumadocs-ui/page';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { canonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site';
import { blog } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// `output: export` has no runtime fallback for dynamic routes; this makes an unlisted slug 404
// instead of throwing the "missing param in generateStaticParams" build/dev error.
export const dynamicParams = false;

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function Page(props: { params: Promise<{ slug: string }> }): Promise<ReactNode> {
    const { slug } = await props.params;
    const page = blog.getPage([slug]);
    if (!page) notFound();

    const MDXContent = page.data.body;
    const url = canonicalUrl(page.url);
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: page.data.title,
        description: page.data.description,
        datePublished: page.data.date,
        author: { '@type': 'Person', name: page.data.author },
        url,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL }
    };

    return (
        <main className="mx-auto w-full max-w-3xl px-4 py-16">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <Link href="/blog" className="font-mono text-sm text-fd-muted-foreground hover:text-fd-foreground">
                ← Blog
            </Link>
            <h1 className="mt-6 text-3xl font-semibold">{page.data.title}</h1>
            <p className="mt-2 font-mono text-sm text-fd-muted-foreground">
                {formatDate(page.data.date)} · {page.data.author}
            </p>
            <div className="mt-8">
                <DocsBody>
                    <MDXContent components={getMDXComponents()} />
                </DocsBody>
            </div>
        </main>
    );
}

export function generateStaticParams(): { slug: string }[] {
    return blog.getPages().map((page) => ({ slug: page.slugs[0] }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await props.params;
    const page = blog.getPage([slug]);
    if (!page) notFound();
    const url = canonicalUrl(page.url);
    return {
        title: page.data.title,
        description: page.data.description,
        alternates: { canonical: url },
        openGraph: {
            type: 'article',
            siteName: SITE_NAME,
            url,
            locale: 'en_US',
            title: page.data.title,
            images: DEFAULT_OG_IMAGE
        }
    };
}
