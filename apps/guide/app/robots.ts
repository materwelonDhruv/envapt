import { SITE_URL } from '@/lib/site';

import type { MetadataRoute } from 'next';

export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: '*', allow: '/' },
        sitemap: new URL('/sitemap.xml', SITE_URL).toString()
    };
}
