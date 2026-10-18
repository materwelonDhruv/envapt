import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { GET as skillFile } from '../app/.well-known/agent-skills/envapt/SKILL.md/route';
import { GET as skillsIndex } from '../app/.well-known/agent-skills/index.json/route';

interface IndexEntry {
    name: string;
    url: string;
    digest: string;
}

async function entries(): Promise<IndexEntry[]> {
    const index = (await (await skillsIndex()).json()) as { skills: IndexEntry[] };
    return index.skills;
}

describe('the published agent skill', () => {
    it('lists the envapt skill at the url that serves it', async () => {
        expect(await entries()).toEqual([
            expect.objectContaining({ name: 'envapt', url: '/.well-known/agent-skills/envapt/SKILL.md' })
        ]);
    });

    it('carries the sha256 of the file it serves', async () => {
        const body = await skillFile().text();
        const [entry] = await entries();

        expect(entry?.digest).toBe(`sha256:${createHash('sha256').update(body).digest('hex')}`);
    });
});
