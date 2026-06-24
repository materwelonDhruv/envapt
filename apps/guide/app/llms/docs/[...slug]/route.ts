import { notFound } from 'next/navigation';

import { getLLMText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, props: { params: Promise<{ slug: string[] }> }): Promise<Response> {
    const { slug } = await props.params;
    const page = source.getPage(slug);
    if (!page) notFound();

    return new Response(await getLLMText(page), { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}

export function generateStaticParams(): { slug: string[] }[] {
    return source.generateParams().filter((param) => param.slug.length > 0);
}
