import { notFound } from 'next/navigation';

import { getLLMText } from '@/lib/get-llm-text';
import { MARKDOWN_FILE } from '@/lib/markdownFile';
import { source } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, props: { params: Promise<{ slug: string[] }> }): Promise<Response> {
    const { slug } = await props.params;
    const page = source.getPage(slug.at(-1) === MARKDOWN_FILE ? slug.slice(0, -1) : slug);
    if (!page) notFound();

    return new Response(await getLLMText(page), { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}

export function generateStaticParams(): { slug: string[] }[] {
    return source.generateParams().map((param) => ({ slug: [...param.slug, MARKDOWN_FILE] }));
}
