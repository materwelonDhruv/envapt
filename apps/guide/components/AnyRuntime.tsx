import Link from 'next/link';

import { Code } from '@/components/Code';
import { CodeCard } from '@/components/CodeCard';
import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

const WORKER = `import { env } from 'cloudflare:workers';
import { Converters, Envapter, PortableSource } from 'envapt';

Envapter.useSource(new PortableSource(env));

const api = Envapter.getAs('API_BASE_URL', Converters.Url);`;

const BROWSER = `import { Envapter, PortableSource } from 'envapt';

// Vite inlines import.meta.env at build time
Envapter.useSource(new PortableSource(import.meta.env));

const beta = Envapter.getBoolean('VITE_BETA', false);`;

export function AnyRuntime(): ReactNode {
    return (
        <Section
            title="Bind a source, read it typed."
            lead="A source is what envapt reads variables from. On Node, Bun, and Deno, importing envapt binds one that reads process.env and your .env files. On Cloudflare Workers, in the browser, or for secrets you fetch from a store at boot, you bind one yourself in a single line and read with the same typed API."
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
                <p className="mt-3 border-t border-fd-border pt-3 font-mono text-[12.5px] text-fd-muted-foreground">
                    Browser values end up in your bundle, where anyone can read them. Keep secrets on the server.
                </p>
            </div>
        </Section>
    );
}
