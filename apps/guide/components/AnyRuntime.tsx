import Link from 'next/link';

import { Code } from '@/components/Code';
import { CodeCard } from '@/components/CodeCard';
import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

const WORKER = `import { env } from 'cloudflare:workers';
import { Envapter, WorkerEnvSource } from 'envapt/workerd';

Envapter.useSource(new WorkerEnvSource(env));

const port = Envapter.getNumber('PORT', 3000);`;

const BROWSER = `import { Envapter, ManualEnvSource } from 'envapt/browser';

// Vite replaces import.meta.env at build time
Envapter.useSource(new ManualEnvSource(import.meta.env));

const beta = Envapter.getBoolean('VITE_BETA', false);`;

export function AnyRuntime(): ReactNode {
    return (
        <Section
            eyebrow="// any runtime"
            title="Bind a source, read it typed."
            lead="On Node, Bun, and Deno the source binds itself on import. On Cloudflare Workers and in the browser you bind it in one line, then read with the same typed API."
        >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <CodeCard fileName="worker.ts">
                    <Code code={WORKER} />
                </CodeCard>
                <CodeCard fileName="main.ts">
                    <Code code={BROWSER} />
                </CodeCard>
            </div>

            <div className="mt-6 rounded-xl border border-fd-border bg-(--ev-panel) p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-mono text-[12.5px] text-fd-muted-foreground">
                        <span className="text-(--ev-teal)">Node · Bun · Deno</span> bind the source on import.
                    </p>
                    <p className="font-mono text-[12.5px]">
                        <Link href="/docs/workers" className="text-(--ev-link) hover:underline">
                            Workers
                        </Link>
                        <span className="text-(--ev-gutter)"> · </span>
                        <Link href="/docs/browser" className="text-(--ev-link) hover:underline">
                            Browser
                        </Link>
                        <span className="text-(--ev-gutter)"> · </span>
                        <Link href="/docs/sources" className="text-(--ev-link) hover:underline">
                            Sources
                        </Link>
                    </p>
                </div>
                <p className="mt-3 border-t border-fd-border pt-3 font-mono text-[12.5px] text-fd-muted-foreground">
                    Browser values are inlined into your bundle, so seed public configuration only, never a secret.
                </p>
            </div>
        </Section>
    );
}
