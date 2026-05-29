'use client';

import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useTheme } from 'next-themes';

import { BaseButton } from '@/components/BaseButton';

import type { ReactNode } from 'react';

// Shared Search / theme / GitHub controls, composed by both the home navbar (NavControls) and the
// docs ToC header (TocControls). Each is a BaseButton segment; callers wrap them in a group.

export function SearchTrigger({ className }: { className?: string }): ReactNode {
    const { setOpenSearch } = useSearchContext();
    return (
        <BaseButton aria-label="Search" onClick={() => setOpenSearch(true)} className={className}>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
            </svg>
            Search
            <span className="ml-auto font-sans text-xs text-fd-muted-foreground">⌘K</span>
        </BaseButton>
    );
}

export function ThemeToggle(): ReactNode {
    const { resolvedTheme, setTheme } = useTheme();
    return (
        <BaseButton aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
            {/* both icons render server + client; the .dark class swaps them (no hydration mismatch) */}
            <svg
                className="hidden size-4 dark:block"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
            </svg>
            <svg
                className="block size-4 dark:hidden"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
            >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
        </BaseButton>
    );
}

export function GithubLink(): ReactNode {
    return (
        <BaseButton href="https://github.com/materwelonDhruv/envapt" target="_blank" aria-label="GitHub repository">
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2 0 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
            </svg>
        </BaseButton>
    );
}
