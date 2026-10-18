import { describe, expect, it } from 'vitest';

import { GET as fullText } from '../app/llms-full.txt/route';
import { GET as index } from '../app/llms.txt/route';
import { SITE_DESCRIPTION, SITE_URL } from '../lib/site';

const HEADER = `# envapt\n\n> ${SITE_DESCRIPTION}\n\n`;
const MARKDOWN_RULE = 'Accept: text/markdown';

async function llmsTxt(): Promise<string> {
    return (await index()).text();
}

describe('llms.txt', () => {
    it('opens with the site name and a one-line summary', async () => {
        expect((await llmsTxt()).startsWith(HEADER)).toBe(true);
    });

    it('puts the rules for an agent above the page list', async () => {
        const text = await llmsTxt();

        expect(text.indexOf(MARKDOWN_RULE)).toBeGreaterThan(0);
        expect(text.indexOf(MARKDOWN_RULE)).toBeLessThan(text.indexOf('[Quick Start]'));
    });

    it('links each docs page to its markdown copy by full url', async () => {
        const text = await llmsTxt();

        expect(text).toContain(`[Quick Start](${SITE_URL}/llms/docs/quick-start/)`);
        expect(text).not.toMatch(/\]\(\//);
    });

    it('lists the blog posts', async () => {
        expect(await llmsTxt()).toContain(`(${SITE_URL}/blog/reading-typed-env/)`);
    });
});

describe('llms-full.txt', () => {
    it('opens with the same header and rules as llms.txt', async () => {
        const full = await (await fullText()).text();

        expect(full.startsWith(HEADER)).toBe(true);
        expect(full.indexOf(MARKDOWN_RULE)).toBeLessThan(full.indexOf('\n# '));
    });
});
