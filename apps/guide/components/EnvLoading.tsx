import { Code } from '@/components/Code';
import { Section } from '@/components/Section';

import type { ReactNode } from 'react';

const RESOLVED = `Envapter.get('DATABASE_URL');
// pg://prod-db:5432/app`;

export function EnvLoading(): ReactNode {
    return (
        <Section
            title={
                <>
                    On Node, Bun, and Deno, envapt loads <span className="text-(--ev-link)">.env</span>.
                </>
            }
            lead="In production, envapt reads .env.production.local, then .env.production, then .env.local, then .env. A higher file wins over a lower one. By default, a variable set in the shell wins over every file. envapt skips a missing file, and skips the cascade when the bound source has no files."
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_auto_minmax(0,2fr)] lg:grid-rows-[auto_1fr]">
                <div className="min-w-0 lg:row-span-2">
                    <CascadeStack />
                </div>

                <span
                    aria-hidden="true"
                    className="mx-auto rotate-90 self-center font-mono text-2xl text-(--ev-gutter) lg:rotate-0"
                >
                    →
                </span>

                <div className="min-w-0 rounded-xl border border-fd-border bg-(--ev-panel) p-5">
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

                <div className="min-w-0 rounded-xl border border-fd-border bg-(--ev-panel) p-5 lg:col-start-3 lg:self-end">
                    <p className="mb-2 text-[14px] text-fd-muted-foreground">Need the values on process.env?</p>
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
                <li className="rounded-lg border border-l-2 border-fd-border border-l-(--ev-teal) bg-(--ev-panel)">
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
                    <span className="font-mono text-[11px] text-(--ev-gutter)">missing, skipped</span>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-fd-border bg-(--ev-panel) px-3 py-2.5">
                    <span className="font-mono text-[12.5px] text-fd-muted-foreground">.env</span>
                    <span className="font-mono text-[11px] text-(--ev-gutter)">base</span>
                </li>
            </ol>
        </div>
    );
}
