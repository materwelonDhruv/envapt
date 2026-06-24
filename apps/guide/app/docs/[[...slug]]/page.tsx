import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

import { TocControls } from '@/components/TocControls';
import { canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/site';
import { source } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }): Promise<ReactNode> {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) notFound();

    const MDXContent = page.data.body;
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: page.data.title,
        description: page.data.description,
        url: canonicalUrl(page.url),
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL }
    };

    return (
        <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ header: <TocControls /> }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
            <DocsBody>
                <MDXContent components={getMDXComponents()} />
            </DocsBody>
        </DocsPage>
    );
}

export function generateStaticParams(): { slug?: string[] }[] {
    return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) notFound();
    const url = canonicalUrl(page.url);
    const slug = params.slug ?? [];
    const ogImage = `/docs-og/${[...slug, 'image.png'].join('/')}`;
    const markdownUrl = slug.length ? new URL(`/llms/docs/${slug.join('/')}`, SITE_URL).toString() : undefined;
    return {
        title: page.data.title,
        description: page.data.description,
        alternates: {
            canonical: url,
            types: markdownUrl ? { 'text/markdown': markdownUrl } : undefined
        },
        openGraph: { type: 'article', siteName: SITE_NAME, url, locale: 'en_US', images: ogImage }
    };
}
