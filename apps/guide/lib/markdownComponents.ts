import { markdownTable } from 'fumadocs-core/mdx-plugins/stringifier';
import { asMarkdown, md } from 'fumadocs-core/server';
import { Children } from 'react';

import { CALLOUT_LABELS, DEFAULT_CALLOUT_TYPE } from '@/lib/callout';

import type { CalloutType } from '@/lib/callout';
import type { TypeNode } from 'fumadocs-ui/components/type-table';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';

const INDENT = '  ';

function dedent(text: string): string {
    const lines = text.split('\n');
    const widths = lines.filter((line) => line.trim() !== '').map((line) => /^ */.exec(line)?.[0].length ?? 0);
    const common = Math.min(...widths);
    return lines.map((line) => line.slice(common)).join('\n');
}

function indent(text: string): string {
    return text.replace(/^(?=.)/gm, INDENT);
}

function block(text: string): string {
    return `\n${text.trim()}\n\n`;
}

// MDX passes the whitespace between two tags as a text child
function elementsOf(children: ReactNode): ReactNode[] {
    return Children.toArray(children).filter((child) => typeof child !== 'string' || child.trim() !== '');
}

async function markdownOf(node: ReactNode): Promise<string> {
    return dedent((await md`${node}`).replace(/^\n+|\n+$/g, ''));
}

async function Callout({
    type = DEFAULT_CALLOUT_TYPE,
    title,
    children
}: {
    type?: CalloutType;
    title?: ReactNode;
    children?: ReactNode;
}): Promise<string> {
    asMarkdown();
    const label = title === undefined ? CALLOUT_LABELS[type] : await markdownOf(title);
    return md.linePrefix('> ')`**${label}**\n\n${await markdownOf(children)}`;
}

async function Tab({ value, children }: { value: string; children?: ReactNode }): Promise<string> {
    asMarkdown();
    return block(`**${value}**\n\n${await markdownOf(children)}`);
}

function PassThrough({ children }: { children?: ReactNode }): ReactNode {
    asMarkdown();
    return children;
}

function Card({ title, href, description }: { title: string; href: string; description?: string }): string {
    asMarkdown();
    return description === undefined ? `- [${title}](${href})\n` : `- [${title}](${href}): ${description}\n`;
}

async function List({ children }: { children?: ReactNode }): Promise<string> {
    asMarkdown();
    return block(await md`${elementsOf(children)}`);
}

async function Folder({ name, children }: { name: string; children?: ReactNode }): Promise<string> {
    asMarkdown();
    return `- ${name}/\n${indent(await md`${elementsOf(children)}`)}`;
}

function File({ name }: { name: string }): string {
    asMarkdown();
    return `- ${name}\n`;
}

async function cell(node: ReactNode): Promise<string> {
    return node === undefined ? '' : (await md`${node}`).trim();
}

async function codeCell(node: ReactNode): Promise<string> {
    const text = await cell(node);
    return text === '' ? '' : `\`${text}\``;
}

async function TypeTable({ type }: { type: Record<string, TypeNode> }): Promise<string> {
    asMarkdown();
    const rows = await Promise.all(
        Object.entries(type).map(async ([name, field]) => [
            field.required ? `\`${name}\` (required)` : `\`${name}\``,
            await codeCell(field.type),
            await codeCell(field.default),
            await cell(field.description)
        ])
    );
    return block(markdownTable([['Name', 'Type', 'Default', 'Description'], ...rows]));
}

export const MARKDOWN_COMPONENTS: MDXComponents = {
    Callout,
    Tabs: PassThrough,
    Tab,
    Steps: PassThrough,
    Step: PassThrough,
    Cards: List,
    Card,
    Files: List,
    Folder,
    File,
    TypeTable
};
