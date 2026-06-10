import { canonicalUrl } from '@/lib/site';
import { blog, source } from '@/lib/source';

import type { MetadataRoute } from 'next';

export const revalidate = false;

function latest(dates: (Date | undefined)[]): Date | undefined {
    return dates.reduce<Date | undefined>((newest, date) => {
        if (!date) return newest;
        return !newest || date > newest ? date : newest;
    }, undefined);
}

export default function sitemap(): MetadataRoute.Sitemap {
    const docsPages = source.getPages();
    const blogPages = blog.getPages();

    const contentEntries = [...docsPages, ...blogPages].map((page) => ({
        url: canonicalUrl(page.url),
        lastModified: page.data.lastModified
    }));

    return [
        {
            url: canonicalUrl('/'),
            lastModified: latest([...docsPages, ...blogPages].map((page) => page.data.lastModified))
        },
        { url: canonicalUrl('/blog'), lastModified: latest(blogPages.map((page) => page.data.lastModified)) },
        ...contentEntries
    ];
}
