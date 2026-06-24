import Link from 'next/link';

import { BrandLockup } from '@/components/BrandLockup';

import type { ReactNode } from 'react';

const RESOURCES = [
    { label: 'GitHub', href: 'https://github.com/materwelonDhruv/envapt' },
    { label: 'npm', href: 'https://www.npmjs.com/package/envapt' },
    { label: 'JSR', href: 'https://jsr.io/@materwelon/envapt' },
    { label: 'Blog', href: '/blog' }
];

const DOCS = [
    { label: 'Quick Start', href: '/docs/quick-start' },
    { label: 'Envapter', href: '/docs/envapter' },
    { label: 'Decorators', href: '/docs/decorators' },
    { label: 'Converters', href: '/docs/converters' }
];

const MIGRATIONS = [
    { label: 'Migration v4 to v5', href: '/docs/migration-v4-to-v5' },
    { label: 'Migration v5 to v6', href: '/docs/migration-v5-to-v6' },
    { label: 'Migration v6 to v7', href: '/docs/migration-v6-to-v7' }
];

export function SiteFooter(): ReactNode {
    return (
        <footer className="border-t border-fd-border">
            <div className="mx-auto flex max-w-295 flex-col gap-10 px-6 py-12 md:flex-row md:items-start md:justify-between">
                <div className="max-w-xs">
                    <Link href="/" className="inline-flex items-center">
                        <BrandLockup glyphSize={24} wordmarkHeight={16} gap={10} />
                    </Link>
                    <p className="mt-3 text-sm/relaxed text-fd-muted-foreground">
                        The apt way to handle environment variables. Read them as typed values, with zero runtime
                        dependencies.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3">
                    <nav className="flex flex-col gap-2.5 font-mono text-[13px]">
                        <p className="mb-1 text-xs tracking-wide text-fd-muted-foreground/70 uppercase">Resources</p>
                        {RESOURCES.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                    <nav className="flex flex-col gap-2.5 font-mono text-[13px]">
                        <p className="mb-1 text-xs tracking-wide text-fd-muted-foreground/70 uppercase">Docs</p>
                        {DOCS.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <nav className="flex flex-col gap-2.5 font-mono text-[13px]">
                        <p className="mb-1 text-xs tracking-wide text-fd-muted-foreground/70 uppercase">Migrations</p>
                        {MIGRATIONS.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
            <div className="border-t border-fd-border">
                <div className="mx-auto flex max-w-295 items-center justify-between gap-3 px-6 py-5 text-sm text-fd-muted-foreground">
                    <span>Apache 2.0</span>
                    <span>
                        Built by{' '}
                        <a
                            href="https://github.com/materwelondhruv"
                            target="_blank"
                            rel="noreferrer"
                            className="text-(--ev-link) hover:underline"
                        >
                            @materwelonDhruv
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}
