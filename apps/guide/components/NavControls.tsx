'use client';

import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useTheme } from 'next-themes';

import { BaseButton } from '@/components/BaseButton';
import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

const ICON_EASE = 'transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]';

interface NavControlsProps {
    menuOpen: boolean;
    onToggleMenu: () => void;
}

export function NavControls({ menuOpen, onToggleMenu }: NavControlsProps): ReactNode {
    const { setOpenSearch } = useSearchContext();
    const { resolvedTheme, setTheme } = useTheme();

    return (
        <div className="ml-auto flex items-center divide-x divide-fd-border overflow-hidden rounded-[10px] border border-fd-border bg-fd-card/40">
            <BaseButton aria-label="Search" onClick={() => setOpenSearch(true)}>
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                </svg>
                <span className="hidden sm:inline">Search</span>
                <span className="hidden font-sans text-xs text-fd-muted-foreground sm:inline">⌘K</span>
            </BaseButton>

            <BaseButton aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
                {/* both icons render identically server + client; the .dark class swaps them (no mismatch) */}
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

            <BaseButton href="https://github.com/materwelonDhruv/envapt" target="_blank">
                GitHub <span className="text-(--ev-link)">↗</span>
            </BaseButton>

            <BaseButton aria-label="Menu" aria-expanded={menuOpen} className="md:hidden" onClick={onToggleMenu}>
                {/* hamburger <-> X: cross-fade + rotate (both rendered, toggled), not a hard swap */}
                <span className="relative block size-4">
                    <svg
                        className={cn(
                            'absolute inset-0 size-4',
                            ICON_EASE,
                            menuOpen ? 'rotate-90 opacity-0' : 'opacity-100'
                        )}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path d="M3 6h18M3 12h18M3 18h18" />
                    </svg>
                    <svg
                        className={cn(
                            'absolute inset-0 size-4',
                            ICON_EASE,
                            menuOpen ? 'opacity-100' : '-rotate-90 opacity-0'
                        )}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                </span>
            </BaseButton>
        </div>
    );
}
