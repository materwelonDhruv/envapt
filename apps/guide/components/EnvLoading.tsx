import { Code } from '@/components/Code';
import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

const RESOLVED = `Envapter.get('DATABASE_URL');
// pg://prod-db:5432/app`;

export function EnvLoading(): ReactNode {
    return (
        <Section
            eyebrow="// .env, loaded"
            title={
                <>
                    Loads your .env, not just <span className="text-(--ev-link)">process.env</span>.
                </>
            }
            lead="In production, envapt reads .env.production.local, then .env.production, then .env.local, then .env. Values from higher files win; missing files are skipped."
        >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="min-w-0 lg:basis-3/5">
                    <CascadeStack />
                </div>

                <span
                    aria-hidden="true"
                    className="mx-auto shrink-0 rotate-90 font-mono text-2xl text-(--ev-gutter) lg:rotate-0"
                >
                    →
                </span>

                <div className="min-w-0 rounded-xl border border-fd-border bg-(--ev-panel) p-5 lg:basis-2/5">
                    <p className="mb-2 font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase">
                        resolved
                    </p>
                    <div className="overflow-hidden rounded-md border border-fd-border">
                        <Code code={RESOLVED} lang="ts" dense />
                    </div>
                    <p className="mt-3 font-mono text-[12.5px] text-(--ev-teal)">
                        {'${DB_HOST}'} expanded into the URL.
                    </p>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-fd-border bg-(--ev-panel) p-5 lg:flex-row lg:items-center lg:justify-between">
                <p className="font-mono text-[12.5px] text-fd-muted-foreground">
                    Node <span className="text-(--ev-teal)">20+</span> · Bun{' '}
                    <span className="text-(--ev-teal)">1.3+</span> · Deno <span className="text-(--ev-teal)">2.5+</span>{' '}
                    · zero dependencies
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <span className="shrink-0 text-[14px] text-fd-muted-foreground">Coming from dotenv?</span>
                    <div className="overflow-hidden rounded-md border border-fd-border">
                        <Code code="import 'envapt/config';" lang="ts" dense />
                    </div>
                </div>
            </div>
        </Section>
    );
}

function CascadeStack(): ReactNode {
    return (
        <div className="rounded-xl border border-fd-border bg-(--ev-panel) p-5">
            <p className="mb-3 font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase">
                load order · most-specific wins
            </p>
            <ol className="flex flex-col gap-2">
                <li className="rounded-lg border border-fd-border border-l-2 border-l-(--ev-teal) bg-(--ev-panel)">
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="font-mono text-[12.5px]">.env.production.local</span>
                        <span className="font-mono text-[11px] text-(--ev-teal)">wins</span>
                    </div>
                    <div className="border-t border-fd-border">
                        <Code code="DATABASE_URL=pg://${DB_HOST}:5432/app" lang="dotenv" dense />
                    </div>
                </li>
                <li className="rounded-lg border border-fd-border bg-(--ev-panel)">
                    <div className="px-3 py-2">
                        <span className="font-mono text-[12.5px]">.env.production</span>
                    </div>
                    <div className="border-t border-fd-border">
                        <Code code="DB_HOST=prod-db" lang="dotenv" dense />
                    </div>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-fd-border bg-(--ev-panel) px-3 py-2.5">
                    <span className="font-mono text-[12.5px] text-fd-muted-foreground">.env.local</span>
                    <span className="font-mono text-[11px] text-(--ev-gutter)">skipped</span>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-fd-border bg-(--ev-panel) px-3 py-2.5">
                    <span className="font-mono text-[12.5px] text-fd-muted-foreground">.env</span>
                    <span className="font-mono text-[11px] text-(--ev-gutter)">base</span>
                </li>
            </ol>
        </div>
    );
}
