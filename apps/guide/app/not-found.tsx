import { BaseButton } from '@/components/BaseButton';

import type { ReactNode } from 'react';

export default function NotFound(): ReactNode {
    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
            <p className="font-mono text-sm text-(--ev-gold)">404</p>
            <h1 className="font-sans text-3xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-fd-muted-foreground">That key resolved to nothing.</p>
            <BaseButton href="/" variant="solid" className="mt-2">
                Back home
            </BaseButton>
        </main>
    );
}
