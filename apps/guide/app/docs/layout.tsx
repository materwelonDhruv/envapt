import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { SidebarControls } from '@/components/SidebarControls';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

import type { ReactNode } from 'react';

// No custom header on docs: fumadocs' default header is md:hidden, so desktop has no top bar and
// the sidebar/content/ToC start flush. The Search/theme/GitHub controls live above the ToC, plus a
// sidebar-footer copy (SidebarControls) for widths below xl where the ToC collapses.
export default function Layout({ children }: { children: ReactNode }): ReactNode {
    return (
        <DocsLayout {...baseOptions()} tree={source.getPageTree()} sidebar={{ footer: <SidebarControls /> }}>
            {children}
        </DocsLayout>
    );
}
