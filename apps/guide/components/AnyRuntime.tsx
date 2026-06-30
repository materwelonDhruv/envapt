import Link from 'next/link';

import { Code } from '@/components/Code';
import { CodeCard } from '@/components/CodeCard';
import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

const WORKER = `import { env } from 'cloudflare:workers';
import { Envapter, WorkerEnvSource } from 'envapt';

Envapter.useSource(new WorkerEnvSource(env));

const port = Envapter.getNumber('PORT', 3000);`;

const BROWSER = `import { Envapter, ManualEnvSource } from 'envapt';

// Vite replaces import.meta.env at build time
Envapter.useSource(new ManualEnvSource(import.meta.env));

const beta = Envapter.getBoolean('VITE_BETA', false);`;

export function AnyRuntime(): ReactNode {
    return (
        <Section
            eyebrow="// any source"
            title="Bind a source, read it typed."
            lead="A source is any object with a readVars() method. On Node, Bun, and Deno one binds itself on import, reading process.env and your .env files. On Cloudflare Workers, in the browser, or for secrets you fetch from a store at boot, you bind it in one line and read with the same typed API."
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
                        <span className="text-(--ev-gutter)"> · </span>
                        <Link href="/docs/secret-stores" className="text-(--ev-link) hover:underline">
                            Secret stores
                        </Link>
                    </p>
                </div>
                <p className="mt-3 border-t border-fd-border pt-3 font-mono text-[12.5px] text-fd-muted-foreground">
                    Fetch secrets from 1Password, Vault, Doppler, or any store at boot, then bind the resolved object as
                    a source. envapt reads them typed, it does not fetch them.{' '}
                    <Link href="/docs/secret-stores" className="text-(--ev-link) hover:underline">
                        Using secret stores
                    </Link>
                    .
                </p>
                <p className="mt-3 font-mono text-[12.5px] text-fd-muted-foreground">
                    Browser values are inlined into your bundle, so seed public configuration only, never a secret.
                </p>
            </div>
        </Section>
    );
}
