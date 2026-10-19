import { describe, expect, it } from 'vitest';

import { GET as fullText } from '../app/llms-full.txt/route';
import { generateStaticParams as markdownCopies } from '../app/llms/docs/[...slug]/route';

const FENCE = /^(`{3,})[^\n]*\n[\s\S]*?^\1$/gm;
const INLINE_CODE = /`[^`\n]+`/g;

function prose(markdown: string): string {
    return markdown.replace(FENCE, '').replace(INLINE_CODE, '');
}

async function everyPage(): Promise<string> {
    return (await fullText()).text();
}

describe('the markdown copy an agent reads', () => {
    it('renders every MDX component as markdown', async () => {
        expect(prose(await everyPage())).not.toMatch(/(?<!\\)<\/?[A-Z]\w*[\s/>]/);
    });

    it('leaves the heading ids off every heading', async () => {
        expect(await everyPage()).not.toMatch(/^#+ .*\[#[\w-]+\]$/m);
    });

    it('leaves out the prettier-ignore comments', async () => {
        expect(await everyPage()).not.toContain('prettier-ignore');
    });

    it('prints a twoslash sample as the code a reader sees', async () => {
        const text = await everyPage();

        expect(text).not.toMatch(/^```\w+ .*twoslash/m);
        expect(text).not.toContain('---cut---');
        expect(text).not.toMatch(/^\s*\/\/\s*\^\?/m);
    });

    it('writes a copy for the docs root', () => {
        expect(markdownCopies()).toContainEqual({ slug: ['index.md'] });
    });
});
