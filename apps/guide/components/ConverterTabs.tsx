'use client';

import { useState } from 'react';

import { CodeCard } from '@/components/CodeCard';
import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

interface Converter {
    readonly name: string;
    readonly expr: string;
    readonly key: string;
    readonly raw: string;
    readonly out: string;
    readonly type: string;
}

const CONVERTERS: readonly Converter[] = [
    { name: 'String', expr: 'Converters.String', key: 'APP_NAME', raw: 'envapt', out: "'envapt'", type: 'string' },
    { name: 'Number', expr: 'Converters.Number', key: 'RATE', raw: '0.5', out: '0.5', type: 'number' },
    {
        name: 'Boolean',
        expr: 'Converters.Boolean',
        key: 'DEBUG',
        raw: 'yes',
        out: 'true',
        type: 'boolean'
    },
    { name: 'Integer', expr: 'Converters.Integer', key: 'MAX_CONN', raw: '100', out: '100', type: 'number' },
    { name: 'Float', expr: 'Converters.Float', key: 'RATIO', raw: '0.25', out: '0.25', type: 'number' },
    {
        name: 'Bigint',
        expr: 'Converters.Bigint',
        key: 'ID',
        raw: '9007199254740993',
        out: '9007199254740993n',
        type: 'bigint'
    },
    { name: 'Symbol', expr: 'Converters.Symbol', key: 'CACHE_NS', raw: 'app', out: 'Symbol(app)', type: 'symbol' },
    {
        name: 'Json',
        expr: 'Converters.Json',
        key: 'FLAGS',
        raw: '{"beta":true}',
        out: '{ beta: true }',
        type: 'JsonValue'
    },
    { name: 'Url', expr: 'Converters.Url', key: 'API_URL', raw: 'https://api.io', out: 'URL { … }', type: 'URL' },
    { name: 'Regexp', expr: 'Converters.Regexp', key: 'SLUG', raw: '/^[a-z-]+$/', out: '/^[a-z-]+$/', type: 'RegExp' },
    {
        name: 'Date',
        expr: 'Converters.Date',
        key: 'RELEASED_AT',
        raw: '2024-01-15T10:30:00Z',
        out: 'Date { … }',
        type: 'Date'
    },
    { name: 'Time', expr: 'Converters.Time', key: 'CACHE_TTL', raw: '15m', out: '900000', type: 'number' },
    {
        name: 'array',
        expr: 'Converters.array({ of: Converters.Url })',
        key: 'ALLOWED_ORIGINS',
        raw: 'https://a.io,https://b.io',
        out: '[URL { … }, URL { … }]',
        type: 'URL[]'
    },
    { name: 'Port', expr: 'Converters.Port', key: 'PORT', raw: '8080', out: '8080', type: 'number' },
    {
        name: 'Email',
        expr: 'Converters.Email',
        key: 'ADMIN',
        raw: 'ops@corp.io',
        out: "'ops@corp.io'",
        type: 'string'
    }
];

// centers the active tab in the strip without scrolling the page
function scrollTabIntoView(el: HTMLButtonElement | null): void {
    if (el === null) return;
    // el is null on unmount. A mounted tab always has a parent strip
    const strip = el.parentElement;
    if (strip === null) throw new Error('scrollTabIntoView: active tab has no parent strip');
    strip.scrollLeft = el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2;
}

export function ConverterTabs(): ReactNode {
    const [active, setActive] = useState<Converter>(CONVERTERS.find((c) => c.name === 'Time') ?? CONVERTERS[0]);

    return (
        <CodeCard fileName="env.ts" className="flex flex-col">
            <div
                role="tablist"
                aria-label="Built-in converters"
                className="order-2 flex flex-wrap items-center gap-1 border-t border-fd-border p-2 sm:flex-nowrap sm:overflow-x-auto"
            >
                {CONVERTERS.map((c) => {
                    const on = c === active;
                    return (
                        <button
                            type="button"
                            role="tab"
                            key={c.name}
                            id={`ct-tab-${c.name}`}
                            aria-selected={on}
                            aria-controls="ct-panel"
                            ref={on ? scrollTabIntoView : null}
                            onClick={() => setActive(c)}
                            className={cn(
                                'shrink-0 rounded-md px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition-colors sm:text-[12px]',
                                on
                                    ? 'bg-fd-accent font-medium text-fd-foreground dark:text-(--ev-teal)'
                                    : 'text-fd-muted-foreground hover:text-fd-foreground'
                            )}
                        >
                            {c.name.toLowerCase()}
                        </button>
                    );
                })}
            </div>

            <div
                id="ct-panel"
                role="tabpanel"
                aria-labelledby={`ct-tab-${active.name}`}
                className="flex h-36 flex-col overflow-hidden px-5 py-4 font-mono text-[11px] sm:h-24 sm:text-[13px]"
            >
                <div className="overflow-x-auto whitespace-pre text-fd-muted-foreground">
                    {'Envapter.'}
                    <span className="text-(--ev-teal)">getUsing</span>
                    {'('}
                    <span className="hidden max-sm:inline">{'\n  '}</span>
                    <span className="text-(--ev-eyebrow)">&apos;{active.key}&apos;</span>
                    {','}
                    <span className="max-sm:hidden"> </span>
                    <span className="hidden max-sm:inline">{'\n  '}</span>
                    {active.expr}
                    <span className="hidden max-sm:inline">{'\n'}</span>
                    {')'}
                </div>
                <div className="mt-auto flex flex-col gap-1.5 whitespace-nowrap sm:mt-4 sm:flex-row sm:items-center sm:gap-3">
                    <span className="min-w-0 truncate text-fd-muted-foreground">
                        {active.key}={active.raw}
                    </span>
                    <div className="flex min-w-0 items-center gap-2 sm:contents">
                        <span className="shrink-0 text-(--ev-gutter)">
                            <span className="sm:hidden">↳</span>
                            <span className="hidden sm:inline">→</span>
                        </span>
                        <span className="shrink-0 text-fd-foreground">{active.out}</span>
                        <span className="ml-auto shrink-0 text-(--ev-teal)">{active.type}</span>
                    </div>
                </div>
            </div>
        </CodeCard>
    );
}
