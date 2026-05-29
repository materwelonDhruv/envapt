'use client';

import { Glyph } from '@/components/Glyph';
import { Wordmark } from '@/components/Wordmark';

import type { ReactNode } from 'react';

// Docs sidebar header (fumadocs `nav.title`). fumadocs already wraps this in its own home Link,
// so render no anchor here (a nested <a> breaks hydration). Client component so it can cross into
// the client DocsLayout.
export function SidebarTitle(): ReactNode {
    return (
        <span className="inline-flex items-center gap-2">
            <Glyph className="size-5" />
            <Wordmark className="h-4.5 w-auto translate-y-px" />
        </span>
    );
}
