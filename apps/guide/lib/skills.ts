import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ENVAPT_SKILL_PATH } from './agentLinks';

// the one copy of the skill, in skills/ at the repo root
const SKILL_FILE = join(process.cwd(), '../../skills/envapt/SKILL.md');

const AGENT_SKILLS_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

interface Skill {
    name: string;
    description: string;
    body: string;
}

function frontmatterField(body: string, field: string): string {
    const value = new RegExp(`^${field}: (.+)$`, 'm').exec(body.split(/^---$/m)[1] ?? '')?.[1];
    if (value === undefined) throw new Error(`${SKILL_FILE} has no ${field} in its frontmatter`);
    return value.trim();
}

let cachedSkill: Skill | undefined;

export function envaptSkill(): Skill {
    if (cachedSkill === undefined) {
        const body = readFileSync(SKILL_FILE, 'utf8');
        cachedSkill = {
            name: frontmatterField(body, 'name'),
            description: frontmatterField(body, 'description'),
            body
        };
    }
    return cachedSkill;
}

// the discovery rfc has a client check the file it downloads against this digest
function digestOf(body: string): string {
    return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

export function agentSkillsIndex(): unknown {
    const skill = envaptSkill();
    return {
        $schema: AGENT_SKILLS_SCHEMA,
        skills: [
            {
                name: skill.name,
                type: 'skill-md',
                description: skill.description,
                url: ENVAPT_SKILL_PATH,
                digest: digestOf(skill.body)
            }
        ]
    };
}
