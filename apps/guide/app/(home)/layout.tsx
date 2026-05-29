import { HomeLayout } from 'fumadocs-ui/layouts/home';

import { SiteNavbar } from '@/components/SiteNavbar';
import { baseOptions } from '@/lib/layout.shared';

import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }): ReactNode {
    return (
        <HomeLayout {...baseOptions()} slots={{ header: SiteNavbar }}>
            {children}
        </HomeLayout>
    );
}
