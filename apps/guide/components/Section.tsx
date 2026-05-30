import { Reveal } from '@/components/Reveal';

import type { ReactNode } from 'react';

interface SectionProps {
    eyebrow: string;
    title: ReactNode;
    lead?: ReactNode;
    children: ReactNode;
}

export function Section({ eyebrow, title, lead, children }: SectionProps): ReactNode {
    return (
        <Reveal className="border-b border-fd-border py-16 md:py-24">
            <div className="mx-auto max-w-295 px-6">
                <div className="mb-10 max-w-2xl">
                    <p className="mb-3 font-mono text-[13px] tracking-wide text-(--ev-eyebrow)">{eyebrow}</p>
                    <h2 className="mb-3 text-2xl font-semibold tracking-tight text-balance md:text-[2rem]">{title}</h2>
                    {lead !== undefined && <p className="text-lg/relaxed text-fd-muted-foreground">{lead}</p>}
                </div>
                {children}
            </div>
        </Reveal>
    );
}
