import { llmsIndex } from '@/lib/agents';

export const revalidate = false;

export async function GET(): Promise<Response> {
    return new Response(await llmsIndex(), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
