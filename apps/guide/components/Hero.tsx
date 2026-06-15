import { BaseButton } from '@/components/BaseButton';
import { Code } from '@/components/Code';
import { CodeCard } from '@/components/CodeCard';

import type { ReactNode } from 'react';

const HERO_CODE = `import { Envapter, Converters } from 'envapt';

// numbers, with a fallback
const port = Envapter.getNumber('PORT', 3000);

// ordered keys, first defined wins
const url = Envapter.get(['DATABASE_URL', 'DB_URL']);

// typed lists
const cors = Envapter.getUsing('CORS',
  Converters.array({ of: Converters.String })
);`;

export function Hero(): ReactNode {
    return (
        <section className="relative w-full overflow-hidden border-b border-fd-border py-16 md:py-24">
            <div className="ev-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative mx-auto grid max-w-295 grid-cols-1 items-center gap-12 px-6 md:grid-cols-[1.05fr_1fr]">
                <div className="min-w-0">
                    <p className="mb-4 font-mono text-[13px] tracking-wide text-(--ev-eyebrow)">
                        {'// the apt way to read config'}
                    </p>
                    <h1 className="mb-5 text-4xl leading-[1.04] font-semibold tracking-tight text-balance md:text-5xl">
                        Typed config,
                        <br />
                        from <span className="text-(--ev-link)">any source</span>.
                    </h1>
                    <p className="mb-7 max-w-110 text-lg/relaxed text-fd-muted-foreground">
                        Read config as real types from <code className="font-mono text-[0.92em]">process.env</code>, a
                        Workers binding, a browser bundle, or any object you bind. Zero runtime dependencies.
                        Zod/Valibot/Arktype validation.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <BaseButton href="/docs/quick-start" variant="solid">
                            $ pnpm add envapt
                        </BaseButton>
                        <BaseButton href="/docs" variant="ghost" className="group">
                            Read the docs
                            <span
                                aria-hidden="true"
                                className="inline-block transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-1"
                            >
                                →
                            </span>
                        </BaseButton>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-xs text-fd-muted-foreground">
                        <span className="rounded-full border border-fd-border px-2.5 py-1.5 leading-none">
                            Node <span className="text-(--ev-teal)">20+</span>
                        </span>
                        <span className="rounded-full border border-fd-border px-2.5 py-1.5 leading-none">
                            Bun <span className="text-(--ev-teal)">1.3+</span>
                        </span>
                        <span className="rounded-full border border-fd-border px-2.5 py-1.5 leading-none">
                            Deno <span className="text-(--ev-teal)">2.5+</span>
                        </span>
                        <span className="rounded-full border border-fd-border px-2.5 py-1.5 leading-none">Workers</span>
                        <span className="rounded-full border border-fd-border px-2.5 py-1.5 leading-none">Browser</span>
                        <span className="rounded-full border border-fd-border px-2.5 py-1.5 leading-none">
                            ESM + CJS
                        </span>
                        <span className="rounded-full border border-fd-border px-2.5 py-1.5 leading-none">
                            <span className="text-(--ev-teal)">0</span> dependencies
                        </span>
                    </div>
                </div>

                <CodeCard fileName="config.ts">
                    <Code code={HERO_CODE} />
                </CodeCard>
            </div>
        </section>
    );
}
