import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { SiteNavbar } from '@/components/SiteNavbar';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }): ReactNode {
    return (
        <DocsLayout {...baseOptions()} slots={{ header: SiteNavbar }} tree={source.getPageTree()}>
            {children}
        </DocsLayout>
    );
}
