import { llms } from 'fumadocs-core/source';

import { source } from '@/lib/source';

export const revalidate = false;

export async function GET(): Promise<Response> {
    return new Response(await llms(source).index());
}
