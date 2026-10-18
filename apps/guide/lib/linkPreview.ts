import { formatDate } from '@/lib/date';
import { markdownBody } from '@/lib/get-llm-text';
import { OG } from '@/lib/og/theme';
import { canonicalUrl, JSR_URL, markdownUrl, NPM_URL, REPO_REF, REPO_URL, SITE_NAME } from '@/lib/site';
import { source } from '@/lib/source';

import type { blog } from '@/lib/source';
import type { PreviewCardProps, PreviewLink } from '@/components/PreviewCard';

type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;
type BlogPage = NonNullable<ReturnType<typeof blog.getPage>>;

const SUMMARY = 'Typed config for Node, Bun, Deno, Workers, and the browser.';
// the folder above an API symbol page is its kind: classes, functions, type-aliases
const KIND_SLUG_FROM_END = -2;
const FENCE = /```[\s\S]*?```/g;
const MARKDOWN_LINK = /\[([^\]]+)\]\([^)]*\)/g;

const GUIDE_LINK: PreviewLink = { label: 'Guide', url: canonicalUrl('/docs') };
const GITHUB_LINK: PreviewLink = { label: 'GitHub', url: REPO_URL };

const hex = (color: string): number => Number.parseInt(color.slice(1), 16);
const ACCENT = { guide: hex(OG.brand), api: hex(OG.teal), blog: hex(OG.gold) } as const;

export const HOME_PREVIEW: PreviewCardProps = {
    accent: ACCENT.guide,
    title: SITE_NAME,
    body: [
        SUMMARY,
        '- Typed numbers, URLs, durations, and lists',
        '- zod, valibot, and arktype validation',
        '- Throws at startup when a value is missing',
        '- Zero runtime dependencies'
    ].join('\n'),
    links: [GUIDE_LINK, { label: 'npm', url: NPM_URL }, { label: 'JSR', url: JSR_URL }, GITHUB_LINK]
};

type TreeNode = ReturnType<typeof source.getPageTree>['children'][number];

const textOf = (name: unknown): string[] => (typeof name === 'string' ? [name] : []);

// the separators and folders above the page, outermost first
function trailTo(nodes: readonly TreeNode[], url: string, trail: string[] = []): string[] | undefined {
    let section: string[] = [];
    for (const node of nodes) {
        if (node.type === 'separator') section = textOf(node.name);
        else if (node.type === 'page' && node.url === url) return [...trail, ...section];
        else if (node.type === 'folder') {
            const inside = [...trail, ...section, ...(node.root ? [] : textOf(node.name))];
            if (node.index?.url === url) return inside;
            const found = trailTo(node.children, url, inside);
            if (found) return found;
        }
    }
    return undefined;
}

function apiSummary(page: DocsPage): string {
    const [, , module, ...rest] = page.slugs;
    const moduleName = module === SITE_NAME ? module : `${SITE_NAME}/${module}`;
    if (rest.length === 0) return `The ${moduleName} module`;
    return `${page.data.title} is one of the ${page.slugs.at(KIND_SLUG_FROM_END)?.replace('-', ' ')} exported by ${moduleName}`;
}

// typedoc writes no description frontmatter
async function firstParagraph(page: DocsPage): Promise<string | undefined> {
    const text = (await markdownBody(page)).replace(FENCE, '');
    const paragraph = text.split(/\n{2,}/).find((block) => /^[A-Za-z]/.test(block));
    return paragraph
        ?.replace(MARKDOWN_LINK, '$1')
        .replace(/\s*\n\s*/g, ' ')
        .trim();
}

export async function docsPreview(page: DocsPage): Promise<PreviewCardProps> {
    const isApi = page.slugs[0] === 'api';
    // a bare ) in the path would end the markdown link early
    const sourcePath = page.path.replaceAll('(', '%28').replaceAll(')', '%29');
    const markdown: PreviewLink = { label: 'Markdown', url: markdownUrl(page.url) };

    if (isApi) {
        return {
            accent: ACCENT.api,
            breadcrumb: ['api', ...page.slugs.slice(2, -1)],
            title: page.data.title,
            body: page.data.description ?? (await firstParagraph(page)) ?? apiSummary(page),
            links: [markdown, GUIDE_LINK]
        };
    }

    return {
        accent: ACCENT.guide,
        breadcrumb: ['guide', ...(trailTo(source.getPageTree().children, page.url) ?? [])],
        title: page.data.title,
        body: page.data.description ?? SUMMARY,
        links: [
            markdown,
            { label: 'Edit on GitHub', url: `${REPO_URL}/edit/${REPO_REF}/apps/guide/content/docs/${sourcePath}` }
        ]
    };
}

export function blogPreview(page: BlogPage): PreviewCardProps {
    return {
        accent: ACCENT.blog,
        breadcrumb: ['blog'],
        title: page.data.title,
        body: page.data.description ?? SUMMARY,
        subtext: [formatDate(page.data.date), page.data.author],
        links: [GUIDE_LINK, { label: 'npm', url: NPM_URL }, GITHUB_LINK]
    };
}
