import { llms } from 'fumadocs-core/source';

import { ENVAPT_SKILL_PATH, LLMS_TXT_PATH } from '@/lib/agentLinks';
import { markdownPath } from '@/lib/markdownFile';
import { absoluteUrl, canonicalUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { blog, source } from '@/lib/source';

const DOCS_LINK = /\]\((\/docs[^)]*)\)/g;

const RULES = [
    "Import the readers and decorators from `envapt` on every runtime. The package's export conditions pick the Node build or the portable build. The legacy decorators for `experimentalDecorators` come from `envapt/legacy`.",
    'On Node, Bun, and Deno, envapt reads `process.env` and the `.env` files on import. On Cloudflare Workers, in the browser, and on other edge runtimes, call `Envapter.useSource` before the first read.',
    'Method names and import paths changed between majors. Read the page for an API before you write code against it. The migration pages list what changed in each major.',
    `Each docs page has a markdown copy, and ${absoluteUrl(LLMS_TXT_PATH)} links every one. A request for a docs page with \`Accept: text/markdown\` also returns the markdown.`,
    `The steps for writing envapt code are in the agent skill at ${absoluteUrl(ENVAPT_SKILL_PATH)}.`
];

const HEADER = [`# ${SITE_NAME}`, '', `> ${SITE_DESCRIPTION}`, '', ...RULES.map((rule) => `- ${rule}`), ''];

// llms() links each page's html url
async function docsLinks(): Promise<string> {
    const index = llms(source);
    const links = await Promise.all(source.getPageTree().children.map((node) => index.indexNode(node)));
    return links.join('\n').replace(DOCS_LINK, (_match, url: string) => `](${absoluteUrl(markdownPath(url))})`);
}

function blogLinks(): string {
    return blog
        .getPages()
        .toSorted((a, b) => b.data.date.localeCompare(a.data.date))
        .map((post) => `- [${post.data.title}](${canonicalUrl(post.url)}): ${post.data.description}`)
        .join('\n');
}

export async function llmsIndex(): Promise<string> {
    return [...HEADER, '## Docs', '', await docsLinks(), '', '## Blog', '', blogLinks(), ''].join('\n');
}

export function llmsFull(documents: readonly string[]): string {
    return [...HEADER, documents.join('\n---\n\n')].join('\n');
}
