import { envaptSkill } from '@/lib/skills';

export const dynamic = 'force-static';

export function GET(): Response {
    return new Response(envaptSkill().body, { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}
