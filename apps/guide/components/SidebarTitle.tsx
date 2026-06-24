// Client component so it can render inside fumadocs' client DocsLayout.
'use client';

import { BrandLockup } from '@/components/BrandLockup';
import { VersionBadge } from '@/components/VersionBadge';

import type { ReactNode } from 'react';

// fumadocs wraps `nav.title` in its own home Link, so a nested <a> breaks hydration
export function SidebarTitle(): ReactNode {
    return (
        <span className="flex items-start gap-1">
            <BrandLockup glyphSize={20} wordmarkHeight={18} />
            <VersionBadge />
        </span>
    );
}
