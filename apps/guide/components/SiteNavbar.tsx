'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Glyph } from '@/components/Glyph';
import { NavControls } from '@/components/NavControls';
import { Wordmark } from '@/components/Wordmark';
import { cn } from '@/lib/cn';

import type { ComponentProps, ReactNode } from 'react';

const NAV_LINKS = [
    { label: 'Quick Start', href: '/docs/quick-start' },
    { label: 'Functional API', href: '/docs' },
    { label: 'Converters', href: '/docs' },
    { label: 'Reference', href: '/docs' }
];

export function SiteNavbar(props: ComponentProps<'header'>): ReactNode {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    // On docs pages the sidebar carries the wordmark, so the navbar drops its own branding.
    const isDocs = pathname.startsWith('/docs');

    return (
        <header
            {...props}
            className="sticky top-0 z-40 col-span-full row-start-1 grid grid-cols-subgrid border-b border-fd-border bg-fd-background/80 backdrop-blur-sm layout:[--fd-header-height:var(--fd-nav-height)]"
        >
            {/* Full-width bar, but its content shares the page grid: spans the sidebar..ToC columns
                (col 2-4) with px-4 so the links/controls line up with the sidebar and ToC content. */}
            <div
                className="col-start-2 col-end-5 flex w-full items-center gap-6 px-4"
                style={{ height: 'var(--fd-nav-height)' }}
            >
                {!isDocs && (
                    <Link href="/" className="flex shrink-0 items-center gap-2.5">
                        <Glyph className="size-6.5" />
                        <Wordmark className="h-4.75 w-auto translate-y-px" />
                    </Link>
                )}

                <nav className="hidden items-center gap-6 font-mono text-[13px] md:flex">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={cn(
                                'text-fd-muted-foreground transition-colors hover:text-fd-foreground',
                                pathname === link.href && 'text-(--ev-link)'
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <NavControls isDocs={isDocs} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} />
            </div>

            {/* Hidden on docs: there the hamburger drives the fumadocs sidebar drawer, not this menu. */}
            {/* always rendered + CSS-toggled so close animates too (conditional mount can't animate exit) */}
            <nav
                aria-hidden={!menuOpen}
                className={cn(
                    'absolute inset-x-0 top-full border-b border-fd-border bg-fd-background transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] md:hidden',
                    isDocs && 'hidden',
                    menuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
                )}
            >
                <div className="mx-auto flex max-w-(--fd-layout-width) flex-col px-5 py-2 font-mono text-sm">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            tabIndex={menuOpen ? undefined : -1}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                                'py-2 text-fd-muted-foreground transition-colors hover:text-fd-foreground',
                                pathname === link.href && 'text-(--ev-link)'
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </nav>
        </header>
    );
}
