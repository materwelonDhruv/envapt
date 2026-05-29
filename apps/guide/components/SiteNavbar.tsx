'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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

function Glyph(): ReactNode {
    return (
        <svg viewBox="0 0 100 110" className="size-6.5" fill="none" aria-hidden="true">
            <path d="M15 0H68L100 32V95Q100 110 85 110H15Q0 110 0 95V15Q0 0 15 0Z" fill="#e35d28" />
            <path d="M68 0L100 32L68 32Z" fill="#f7cc88" />
        </svg>
    );
}

export function SiteNavbar(props: ComponentProps<'header'>): ReactNode {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header {...props} className="sticky top-0 z-40 border-b border-fd-border bg-fd-background/80 backdrop-blur-sm">
            <div
                className="mx-auto flex w-full max-w-350 items-center gap-6 px-5"
                style={{ height: 'var(--fd-nav-height)' }}
            >
                <Link href="/" className="flex shrink-0 items-center gap-2.5">
                    <Glyph />
                    <Wordmark className="h-4.75 w-auto translate-y-px" />
                </Link>

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

                <NavControls menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} />
            </div>

            {/* always rendered + CSS-toggled so close animates too (conditional mount can't animate exit) */}
            <nav
                aria-hidden={!menuOpen}
                className={cn(
                    'absolute inset-x-0 top-full border-b border-fd-border bg-fd-background transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] md:hidden',
                    menuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
                )}
            >
                <div className="mx-auto flex max-w-350 flex-col px-5 py-2 font-mono text-sm">
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
