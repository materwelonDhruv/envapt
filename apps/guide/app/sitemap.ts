import { canonicalUrl } from '@/lib/site';
import { source } from '@/lib/source';

import type { MetadataRoute } from 'next';

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
    const pages = source.getPages().map((page) => ({ url: canonicalUrl(page.url) }));
    return [{ url: canonicalUrl('/') }, ...pages];
}
