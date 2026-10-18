import { siteLinks } from '@/lib/agentLinks';
import { SITE_URL } from '@/lib/site';

import type { ReactNode } from 'react';

// the same relations worker.ts sends in the Link header, for a crawler that only reads the html
export function AgentLinks(): ReactNode {
    return siteLinks(SITE_URL).map(({ rel, href, type }) => <link key={rel} rel={rel} href={href} type={type} />);
}
