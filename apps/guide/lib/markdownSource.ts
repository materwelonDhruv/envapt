import { parseCodeBlockAttributes } from 'fumadocs-core/mdx-plugins/codeblock-utils';
import { replaceSource } from 'fumadocs-core/mdx-plugins/stringifier';

import type { LLMsOptions } from 'fumadocs-core/mdx-plugins/remark-llms';
import type { Code, Nodes, Root } from 'mdast';

type VFile = Parameters<typeof replaceSource>[0];

const TWOSLASH = 'twoslash';

// the notations fumadocs-twoslash removes before it renders a sample
const CUT = /^[\s\S]*^\/\/\s?---cut---\n/m;
const FLAG = /^\/\/\s?@\w+.*\n?/gm;
const QUERY = /^\s*\/\/\s*\^(?:\?|\||\^+).*\n?/gm;

function plainTwoslash(code: string): string {
    return code
        .replace(CUT, '')
        .replace(FLAG, '')
        .replace(QUERY, '')
        .replace(/^\n+|\n+$/g, '');
}

function plainFence(node: Code): string {
    const { rest } = parseCodeBlockAttributes(node.meta ?? '', [TWOSLASH]);
    const info = [node.lang, rest.trim()].filter(Boolean).join(' ');
    return `\`\`\`${info}\n${plainTwoslash(node.value)}\n\`\`\``;
}

function isTwoslash(node: Nodes): node is Code {
    return node.type === 'code' && (node.meta?.split(/\s+/).includes(TWOSLASH) ?? false);
}

function visit(node: Nodes, file: VFile): void {
    if (isTwoslash(node)) replaceSource(file, node, plainFence(node));
    if ('children' in node) for (const child of node.children) visit(child, file);
}

export function remarkPlainTwoslash(): (tree: Root, file: VFile) => void {
    return (tree, file) => visit(tree, file);
}

function isComment(node: Nodes): boolean {
    return node.type === 'mdxFlowExpression' && /^\s*\/\*[\s\S]*\*\/\s*$/.test(node.value);
}

// typedoc writes an empty <a id> in front of every member row
function isEmptyAnchor(node: Nodes): boolean {
    return node.type === 'mdxJsxTextElement' && node.name === 'a' && node.children.length === 0;
}

export const MARKDOWN_COPY_OPTIONS: LLMsOptions = {
    output: 'function',
    headingIds: false,
    filterElement: (node) => !isComment(node) && !isEmptyAnchor(node)
};
