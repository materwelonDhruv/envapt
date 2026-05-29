'use client';

import { SidebarTrigger } from 'fumadocs-ui/components/sidebar/base';

import { BaseButton } from '@/components/BaseButton';
import { GithubLink, SearchTrigger, ThemeToggle } from '@/components/ControlButtons';
import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

const ICON_EASE = 'transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]';

const HAMBURGER = 'M3 6h18M3 12h18M3 18h18';

interface NavControlsProps {
    isDocs: boolean;
    menuOpen: boolean;
    onToggleMenu: () => void;
}

// Docs: opens the fumadocs sidebar drawer (the page tree). Elsewhere: toggles the navbar's own link menu.
function MenuTrigger({ isDocs, menuOpen, onToggleMenu }: NavControlsProps): ReactNode {
    if (isDocs) {
        return (
            <SidebarTrigger
                aria-label="Open sidebar"
                className="flex h-8.5 cursor-pointer items-center px-3 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground md:hidden"
            >
                <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                >
                    <path d={HAMBURGER} />
                </svg>
            </SidebarTrigger>
        );
    }

    return (
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
                    <path d={HAMBURGER} />
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
    );
}

export function NavControls({ isDocs, menuOpen, onToggleMenu }: NavControlsProps): ReactNode {
    return (
        <div className="ml-auto flex items-center divide-x divide-fd-border overflow-hidden rounded-[10px] border border-fd-border bg-fd-card/40">
            <SearchTrigger />
            <ThemeToggle />
            <GithubLink />
            <MenuTrigger isDocs={isDocs} menuOpen={menuOpen} onToggleMenu={onToggleMenu} />
        </div>
    );
}
