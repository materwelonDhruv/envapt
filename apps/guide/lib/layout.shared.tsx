import { SidebarTitle } from '@/components/SidebarTitle';

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
    return {
        nav: { title: <SidebarTitle /> },
        // Our own controls (NavControls / TocControls) own theme + search; drop fumadocs' built-in
        // triggers. The search modal stays reachable via useSearchContext().setOpenSearch.
        themeSwitch: { enabled: false },
        searchToggle: { enabled: false }
    };
}
