import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { SidebarControls } from '@/components/SidebarControls';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

import type { ReactNode } from 'react';

// No custom header on docs: fumadocs' default header is md:hidden, so desktop has no top bar and
// the sidebar/content/ToC start flush. The Search/theme/GitHub controls live above the ToC, plus a
// sidebar-footer copy (SidebarControls) for widths below xl where the ToC collapses.
//
// `key` on the footer: fumadocs' Sidebar places this element into a dynamically-built children
// array (its sidebar footer block) without keying it, so React's dev key check flags the element
// we pass. The element is the unkeyed array member, so keying it here silences the warning.
// Tracked upstream; remove once fumadocs keys that array.
export default function Layout({ children }: { children: ReactNode }): ReactNode {
    return (
        <DocsLayout
            {...baseOptions()}
            tree={source.getPageTree()}
            sidebar={{ footer: <SidebarControls key="footer" /> }}
        >
            {children}
        </DocsLayout>
    );
}
