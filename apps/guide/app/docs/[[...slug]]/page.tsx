import { ComponentEmbed } from 'discord-component-embed/react';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/JsonLd';
import { PreviewCard } from '@/components/PreviewCard';
import { TocControls } from '@/components/TocControls';
import { docsPreview } from '@/lib/linkPreview';
import { pageMetadata } from '@/lib/metadata';
import { docsOgImage } from '@/lib/og/images';
import { isApiPage, source } from '@/lib/source';
import { docsJsonLd } from '@/lib/structuredData';
import { getMDXComponents } from '@/mdx-components';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// deeper levels list the signature, Parameters and Returns headings typedoc writes under every member
const API_TOC_DEPTH = 3;

export default async function Page(props: { params: Promise<{ slug?: string[] }> }): Promise<ReactNode> {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) notFound();

    const MDXContent = page.data.body;
    const preview = await docsPreview(page);
    const toc = isApiPage(page) ? page.data.toc.filter((item) => item.depth <= API_TOC_DEPTH) : page.data.toc;

    return (
        <DocsPage toc={toc} full={page.data.full} tableOfContent={{ header: <TocControls /> }}>
            <ComponentEmbed>
                <PreviewCard {...preview} />
            </ComponentEmbed>
            <JsonLd data={docsJsonLd(page)} />
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription className="text-fd-foreground/80">{page.data.description}</DocsDescription>
            <DocsBody>
                <MDXContent components={getMDXComponents({ a: createRelativeLink(source, page) })} />
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
    return pageMetadata({
        title: page.data.title,
        description: page.data.description,
        path: page.url,
        image: docsOgImage(page.slugs, page.data.title),
        type: 'article',
        hasMarkdownCopy: true
    });
}
