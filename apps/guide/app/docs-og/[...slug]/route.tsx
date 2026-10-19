import { notFound } from 'next/navigation';

import { defaultCard, editorCard, ogImage } from '@/lib/og/cards';
import { OG_FILE } from '@/lib/og/images';
import { snippetFor } from '@/lib/og/snippets';
import { source } from '@/lib/source';

import type { ImageResponse } from 'takumi-js/response';

export const dynamic = 'force-static';

export function generateStaticParams(): { slug: string[] }[] {
    return source.generateParams().map((params) => ({ slug: [...params.slug, OG_FILE] }));
}

export async function GET(_req: Request, props: { params: Promise<{ slug: string[] }> }): Promise<ImageResponse> {
    const { slug } = await props.params;
    const pageSlug = slug.slice(0, -1);
    const page = source.getPage(pageSlug);
    if (!page) notFound();

    const snippet = snippetFor(pageSlug);
    return ogImage(snippet ? await editorCard(snippet) : defaultCard());
}
