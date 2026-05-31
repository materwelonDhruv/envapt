// Client component so it can render inside fumadocs' client DocsLayout.
'use client';

import { BrandLockup } from '@/components/BrandLockup';

import type { ReactNode } from 'react';

// Render no anchor: fumadocs wraps `nav.title` in its own home Link, and a nested <a> breaks hydration.
export function SidebarTitle(): ReactNode {
    return <BrandLockup glyphSize={20} wordmarkHeight={18} />;
}
