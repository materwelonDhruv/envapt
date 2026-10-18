import { MARKDOWN_COMPONENTS } from '@/lib/markdownComponents';

import type { source } from '@/lib/source';

type DocsPage = (typeof source)['$inferPage'];

export async function markdownBody(page: DocsPage): Promise<string> {
    return page.data.getText('processed', { components: MARKDOWN_COMPONENTS });
}

export async function getLLMText(page: DocsPage): Promise<string> {
    const { title, description } = page.data;
    const head = description === undefined ? `# ${title}` : `# ${title}\n\n${description}`;
    return `${head}\n\n${await markdownBody(page)}`;
}
