import { llms } from 'fumadocs-core/source';

import { source } from '@/lib/source';

export const revalidate = false;

export function GET(): Response {
    return new Response(llms(source).index());
}
