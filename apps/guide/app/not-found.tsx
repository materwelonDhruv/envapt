import Link from 'next/link';

import type { ReactNode } from 'react';

export default function NotFound(): ReactNode {
    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
            <p className="font-mono text-sm text-(--ev-gold)">404</p>
            <h1 className="font-sans text-3xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-fd-muted-foreground">That key resolved to nothing.</p>
            <Link
                href="/"
                className="mt-2 rounded-lg bg-(--ev-brand) px-4 py-2 font-mono text-sm font-semibold text-(--ev-on-brand)"
            >
                Back home
            </Link>
        </main>
    );
}
