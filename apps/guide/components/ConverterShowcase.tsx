import Link from 'next/link';

import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

const TOKENS: ReadonlyArray<readonly [token: string, returns: string]> = [
    ['Converters.Number', 'number'],
    ['Converters.Boolean', 'boolean'],
    ['Converters.Bigint', 'bigint'],
    ['Converters.Json', 'JsonValue'],
    ['Converters.Url', 'URL'],
    ['Converters.Regexp', 'RegExp'],
    ['Converters.Date', 'Date'],
    ['Converters.Time', 'number (ms)'],
    ['Converters.array({ of })', 'T[]']
];

export function ConverterShowcase(): ReactNode {
    return (
        <Section
            eyebrow="// converters"
            title="Every value, typed."
            lead={
                <>
                    A converter turns the raw string into a typed value. Without one, a value stays{' '}
                    <span className="whitespace-nowrap">
                        a <code className="font-mono text-[0.92em] text-fd-foreground">string</code>.
                    </span>
                </>
            }
        >
            <ul className="grid grid-cols-1 gap-2.5 font-mono text-[12.5px] sm:grid-cols-2 lg:grid-cols-3">
                {TOKENS.map(([token, returns]) => (
                    <li
                        key={token}
                        className="flex items-center gap-2 rounded-[10px] border border-fd-border bg-(--ev-panel) px-3.5 py-3"
                    >
                        <span className="min-w-0 wrap-anywhere">{token}</span>
                        <span aria-hidden="true" className="text-(--ev-gutter)">
                            →
                        </span>
                        <span className="ml-auto shrink-0 text-(--ev-teal)">{returns}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-6 text-[15px] text-fd-muted-foreground">
                Pass your own{' '}
                <code className="font-mono text-[0.92em] text-fd-foreground">{'(raw, fallback) => T'}</code> function,
                or validate through a{' '}
                <Link href="/docs/standard-schema" className="text-(--ev-link) hover:underline">
                    Standard Schema
                </Link>{' '}
                validator (zod, valibot, arktype).{' '}
                <Link href="/docs/converters" className="text-(--ev-link) hover:underline">
                    All converters
                </Link>
                .
            </p>
        </Section>
    );
}
