import { GithubLink, SearchTrigger, ThemeToggle } from '@/components/ControlButtons';

import type { ReactNode } from 'react';

// Search / theme / GitHub cluster above the ToC (fumadocs `tableOfContent.header`), replacing the
// removed top navbar on docs. `-mt-8` cancels most of the ToC's pt-12 so it lines up with the
// sidebar's p-4 top offset.
export function TocControls(): ReactNode {
    return (
        <div className="-mt-8 mb-5 flex items-center divide-x divide-fd-border overflow-hidden rounded-[10px] border border-fd-border bg-fd-card/40">
            <SearchTrigger className="flex-1 justify-start" />
            <ThemeToggle />
            <GithubLink />
        </div>
    );
}
