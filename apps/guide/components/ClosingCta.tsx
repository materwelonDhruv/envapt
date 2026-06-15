import { BaseButton } from '@/components/BaseButton';

import type { ReactNode } from 'react';

export function ClosingCta(): ReactNode {
    return (
        <section className="relative overflow-hidden py-16 md:py-24">
            <div className="ev-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative mx-auto max-w-295 px-6 text-center">
                <h2 className="mb-3 text-2xl font-semibold tracking-tight text-balance md:text-[2rem]">
                    Read config from any source, fully typed.
                </h2>
                <p className="mb-7 text-lg text-fd-muted-foreground">
                    Zero runtime dependencies. Zod/Valibot/Arktype validation.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
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
            </div>
        </section>
    );
}
