import { cn } from '@/lib/cn';
import { ENVAPT_VERSION, npmVersionUrl } from '@/lib/site';

import type { ReactNode } from 'react';

interface VersionBadgeProps {
    linked?: boolean;
}

const MARK = 'mt-[2px] font-mono text-[10px] font-medium leading-none text-(--ev-link) tabular-nums';

export function VersionBadge({ linked = false }: VersionBadgeProps): ReactNode {
    if (!ENVAPT_VERSION) return null;

    const label = `v${ENVAPT_VERSION}`;

    if (!linked) return <span className={MARK}>{label}</span>;

    return (
        <a
            href={npmVersionUrl(ENVAPT_VERSION)}
            target="_blank"
            rel="noreferrer"
            aria-label="envapt on npm"
            className={cn(MARK, 'transition-colors hover:text-(--ev-link-hover)')}
        >
            {label}
        </a>
    );
}
