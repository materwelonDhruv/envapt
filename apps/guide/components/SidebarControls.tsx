'use client';

import { GithubLink, SearchTrigger, ThemeToggle } from '@/components/ControlButtons';

import type { ReactNode } from 'react';

// Controls at the sidebar footer, shown only below xl where the ToC (and its TocControls) collapses:
// on tablet at the bottom of the sidebar, on mobile at the bottom of the drawer.
export function SidebarControls(): ReactNode {
    return (
        <div className="flex items-center divide-x divide-fd-border overflow-hidden rounded-[10px] border border-fd-border bg-fd-card/40 xl:hidden">
            <SearchTrigger className="flex-1 justify-start" />
            <ThemeToggle />
            <GithubLink />
        </div>
    );
}
