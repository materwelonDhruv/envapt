import { cn } from '@/lib/cn';
import { ENVAPT_VERSION } from '@/lib/site';

import type { ReactNode } from 'react';

interface VersionBadgeProps {
    href?: string;
}

const MARK = 'mt-[2px] font-mono text-[10px] font-medium leading-none text-(--ev-link) tabular-nums';

export function VersionBadge({ href }: VersionBadgeProps): ReactNode {
    if (!ENVAPT_VERSION) return null;

    const label = `v${ENVAPT_VERSION}`;

    if (!href) return <span className={MARK}>{label}</span>;

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label="envapt on npm"
            className={cn(MARK, 'transition-colors hover:text-(--ev-link-hover)')}
        >
            {label}
        </a>
    );
}
