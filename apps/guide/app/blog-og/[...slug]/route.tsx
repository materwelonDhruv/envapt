import { notFound } from 'next/navigation';

import { formatDate } from '@/lib/date';
import { blogCard, ogImage } from '@/lib/og/cards';
import { OG_FILE } from '@/lib/og/images';
import { blog } from '@/lib/source';

import type { ImageResponse } from 'takumi-js/response';

export const dynamic = 'force-static';

export function generateStaticParams(): { slug: string[] }[] {
    return blog.getPages().map((page) => ({ slug: [...page.slugs, OG_FILE] }));
}

export async function GET(_req: Request, props: { params: Promise<{ slug: string[] }> }): Promise<ImageResponse> {
    const { slug } = await props.params;
    const page = blog.getPage(slug.slice(0, -1));
    if (!page) notFound();

    return ogImage(blogCard({ title: page.data.title, byline: `${formatDate(page.data.date)} · ${page.data.author}` }));
}
