import { BaseButton } from '@/components/BaseButton';

import type { ReactNode } from 'react';

export function Hero(): ReactNode {
    return (
        <section className="relative w-full overflow-hidden border-b border-fd-border py-16 md:py-24">
            <div className="ev-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative mx-auto grid max-w-295 grid-cols-1 items-center gap-12 px-6 md:grid-cols-[1.05fr_1fr]">
                <div className="min-w-0">
                    <p className="mb-4 font-mono text-[13px] tracking-wide text-(--ev-gold)">
                        {'// the apt way to handle env'}
                    </p>
                    <h1 className="mb-5 text-4xl leading-[1.04] font-semibold tracking-tight text-balance md:text-5xl">
                        Typed config,
                        <br />
                        straight from <span className="text-(--ev-link)">.env</span>.
                    </h1>
                    <p className="mb-7 max-w-110 text-lg/relaxed text-fd-muted-foreground">
                        Read environment variables as real types. Zero runtime dependencies. The same API on Node, Bun,
                        and Deno.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <BaseButton href="/docs/quick-start" variant="solid">
                            $ pnpm add envapt
                        </BaseButton>
                        <BaseButton href="/docs" variant="ghost">
                            Functional API →
                        </BaseButton>
                    </div>
                </div>

                <div className="ev-editor relative min-w-0 bg-(--ev-panel) ring-1 ring-fd-border ring-inset">
                    <div className="ev-editor-fold absolute top-0 right-0 size-7" aria-hidden="true" />
                    <div className="flex items-center gap-2 border-b border-fd-border px-4 py-3">
                        <span className="size-2.5 rounded-full bg-[#e35d28]" />
                        <span className="size-2.5 rounded-full bg-[#f7cc88]" />
                        <span className="size-2.5 rounded-full bg-[#5fd1c4]" />
                        <span className="ml-1.5 font-mono text-xs text-fd-muted-foreground">config.ts</span>
                    </div>
                    <pre className="ev-code overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.9]">
                        <code>
                            <span className="ln" />
                            <span className="ev-k">import</span> {'{ Envapter, Converters }'}{' '}
                            <span className="ev-k">from</span> <span className="ev-s">{"'envapt'"}</span>
                            <span className="ev-k">;</span>
                            {'\n'}
                            <span className="ln" />
                            {'\n'}
                            <span className="ln" />
                            <span className="ev-c">{'// numbers, with a fallback'}</span>
                            {'\n'}
                            <span className="ln" />
                            <span className="ev-k">const</span> port = Envapter.<span className="ev-f">getNumber</span>(
                            <span className="ev-s">{"'PORT'"}</span>, <span className="ev-num">3000</span>)
                            <span className="ev-k">;</span>
                            {'\n'}
                            <span className="ln" />
                            {'\n'}
                            <span className="ln" />
                            <span className="ev-c">{'// ordered keys, first defined wins'}</span>
                            {'\n'}
                            <span className="ln" />
                            <span className="ev-k">const</span> url = Envapter.<span className="ev-f">get</span>([
                            <span className="ev-s">{"'DATABASE_URL'"}</span>, <span className="ev-s">{"'DB_URL'"}</span>
                            ])<span className="ev-k">;</span>
                            {'\n'}
                            <span className="ln" />
                            {'\n'}
                            <span className="ln" />
                            <span className="ev-c">{'// typed lists'}</span>
                            {'\n'}
                            <span className="ln" />
                            <span className="ev-k">const</span> cors = Envapter.<span className="ev-f">getUsing</span>(
                            <span className="ev-s">{"'CORS'"}</span>,{'\n'}
                            <span className="ln" />
                            {'  '}Converters.<span className="ev-f">array</span>({'{ of: Converters.String }'}){'\n'}
                            <span className="ln" />)<span className="ev-k">;</span>
                        </code>
                    </pre>
                </div>
            </div>
        </section>
    );
}
