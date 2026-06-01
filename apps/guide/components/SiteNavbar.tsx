'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { BrandLockup } from '@/components/BrandLockup';
import { NavControls } from '@/components/NavControls';
import { cn } from '@/lib/cn';

import type { ComponentProps, ReactNode } from 'react';

const NAV_LINKS = [
    { label: 'Introduction', href: '/docs/' },
    { label: 'Quick Start', href: '/docs/quick-start' },
    { label: 'Envapter', href: '/docs/envapter' },
    { label: 'Decorators', href: '/docs/decorators' },
    { label: 'Converters', href: '/docs/converters' }
];

export function SiteNavbar(props: ComponentProps<'header'>): ReactNode {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    // On docs pages the sidebar carries the wordmark, so the navbar drops its own branding.
    const isDocs = pathname.startsWith('/docs');

    return (
        <header {...props} className="sticky top-0 z-40 border-b border-fd-border bg-fd-background/80 backdrop-blur-sm">
            {/* max-w-295 px-6 mirrors the hero so branding and controls align with page content, not the viewport edge. */}
            <div
                className="mx-auto flex w-full max-w-295 items-center gap-6 px-6"
                style={{ height: 'var(--fd-nav-height)' }}
            >
                {!isDocs && (
                    <Link href="/" className="flex shrink-0 items-center">
                        <BrandLockup glyphSize={26} wordmarkHeight={19} gap={10} />
                    </Link>
                )}

                <nav className="hidden items-center gap-6 font-mono text-[13px] lg:flex">
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

            {/* Always mounted and CSS-toggled so the close animates; a conditional mount can't animate exit. Hidden on docs, where the hamburger opens the sidebar drawer instead. */}
            <nav
                aria-hidden={!menuOpen}
                className={cn(
                    'absolute inset-x-0 top-full border-b border-fd-border bg-fd-background transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] lg:hidden',
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
