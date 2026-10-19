import { agentSkillsIndex } from '@/lib/skills';

export const dynamic = 'force-static';

export function GET(): Response {
    return Response.json(agentSkillsIndex());
}
