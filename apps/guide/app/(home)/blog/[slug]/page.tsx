import { ComponentEmbed } from 'discord-component-embed/react';
import { DocsBody } from 'fumadocs-ui/page';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/JsonLd';
import { PreviewCard } from '@/components/PreviewCard';
import { formatDate } from '@/lib/date';
import { blogPreview } from '@/lib/linkPreview';
import { pageMetadata } from '@/lib/metadata';
import { blogOgImage } from '@/lib/og/images';
import { blog } from '@/lib/source';
import { blogJsonLd } from '@/lib/structuredData';
import { getMDXComponents } from '@/mdx-components';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// without this the dev build crashes on an unlisted slug
export const dynamicParams = false;

export default async function Page(props: { params: Promise<{ slug: string }> }): Promise<ReactNode> {
    const { slug } = await props.params;
    const page = blog.getPage([slug]);
    if (!page) notFound();

    const MDXContent = page.data.body;

    return (
        <main className="mx-auto w-full max-w-3xl px-4 py-16">
            <ComponentEmbed>
                <PreviewCard {...blogPreview(page)} />
            </ComponentEmbed>
            <JsonLd data={blogJsonLd(page)} />
            <Link href="/blog" className="font-mono text-sm text-fd-muted-foreground hover:text-fd-foreground">
                ← Blog
            </Link>
            <h1 className="mt-6 text-3xl font-semibold">{page.data.title}</h1>
            <p className="mt-2 font-mono text-sm text-fd-muted-foreground">
                {formatDate(page.data.date)} · {page.data.author}
                {page.data.updated !== page.data.date && <> · Updated {formatDate(page.data.updated)}</>}
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
    return pageMetadata({
        title: page.data.title,
        description: page.data.description,
        path: page.url,
        image: blogOgImage(slug, page.data.title),
        type: 'article'
    });
}
