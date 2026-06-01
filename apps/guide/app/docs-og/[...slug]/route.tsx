import { notFound } from 'next/navigation';

import { defaultCard, ogImage, terminalCard } from '@/lib/og/cards';
import { OG_SNIPPETS } from '@/lib/og/snippets';
import { source } from '@/lib/source';

import type { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export function generateStaticParams(): { slug: string[] }[] {
    return source.generateParams().map((params) => ({ slug: [...params.slug, 'image.png'] }));
}

export async function GET(_req: Request, props: { params: Promise<{ slug: string[] }> }): Promise<ImageResponse> {
    const { slug } = await props.params;
    const pageSlug = slug.slice(0, -1);
    const page = source.getPage(pageSlug);
    if (!page) notFound();

    // Pages without a curated snippet get the default card.
    const snippet = OG_SNIPPETS[pageSlug.join('/') || 'index'];
    return ogImage(snippet ? await terminalCard(snippet) : defaultCard());
}
