import { markdownPath } from './markdownFile';

export const LLMS_TXT_PATH = '/llms.txt';
const AGENT_SKILLS_INDEX_PATH = '/.well-known/agent-skills/index.json';
export const ENVAPT_SKILL_PATH = '/.well-known/agent-skills/envapt/SKILL.md';

const MARKDOWN = 'text/markdown';

interface AgentLink {
    rel: string;
    href: string;
    type?: string;
}

export function siteLinks(origin: string): AgentLink[] {
    return [
        { rel: 'describedby', href: new URL(LLMS_TXT_PATH, origin).toString() },
        { rel: 'service-meta', href: new URL(AGENT_SKILLS_INDEX_PATH, origin).toString() }
    ];
}

function serialize({ rel, href, type }: AgentLink): string {
    return type === undefined ? `<${href}>; rel="${rel}"` : `<${href}>; rel="${rel}"; type="${type}"`;
}

export function agentLinkHeader(origin: string, pageWithMarkdownCopy?: string): string {
    const markdown: AgentLink[] =
        pageWithMarkdownCopy === undefined
            ? []
            : [
                  {
                      rel: 'alternate',
                      href: new URL(markdownPath(pageWithMarkdownCopy), origin).toString(),
                      type: MARKDOWN
                  }
              ];
    return [...markdown, ...siteLinks(origin)].map(serialize).join(', ');
}
