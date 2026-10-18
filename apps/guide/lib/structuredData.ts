import { getBreadcrumbItems } from 'fumadocs-core/breadcrumb';

import {
    AUTHOR_URL,
    canonicalUrl,
    JSR_URL,
    NPM_URL,
    REPO_URL,
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_URL
} from '@/lib/site';
import { source } from '@/lib/source';

import type { blog } from '@/lib/source';

type DocsPage = (typeof source)['$inferPage'];
type BlogPage = (typeof blog)['$inferPage'];

// google merges nodes that share an @id
const SOFTWARE_ID = `${SITE_URL}/#software`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const DOCS_PATH = '/docs';

const AUTHOR = { '@type': 'Person', name: 'Dhruv', url: AUTHOR_URL };

export function siteJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'SoftwareSourceCode',
                '@id': SOFTWARE_ID,
                name: SITE_NAME,
                description: SITE_DESCRIPTION,
                url: SITE_URL,
                codeRepository: REPO_URL,
                sameAs: [NPM_URL, JSR_URL, REPO_URL],
                programmingLanguage: 'TypeScript',
                runtimePlatform: ['Node.js', 'Bun', 'Deno', 'Cloudflare Workers', 'Browser'],
                license: 'https://www.apache.org/licenses/LICENSE-2.0',
                author: AUTHOR
            },
            {
                '@type': 'WebSite',
                '@id': WEBSITE_ID,
                name: SITE_NAME,
                description: SITE_DESCRIPTION,
                url: SITE_URL,
                about: { '@id': SOFTWARE_ID }
            }
        ]
    };
}

// google requires a url on every item but the last. a folder with no index page has none
function breadcrumbOf(page: DocsPage): Record<string, unknown>[] {
    const items = getBreadcrumbItems(page.url, source.getPageTree(), {
        includeRoot: { url: DOCS_PATH },
        includePage: true
    });
    const linked = items.flatMap(({ name, url }) =>
        url === undefined || typeof name !== 'string' ? [] : [{ name, url }]
    );
    return linked
        .filter((item, index) => item.url !== linked[index - 1]?.url)
        .map(({ name, url }, index) => ({ '@type': 'ListItem', position: index + 1, name, item: canonicalUrl(url) }));
}

export function docsJsonLd(page: DocsPage): Record<string, unknown> {
    const url = canonicalUrl(page.url);
    const { lastModified } = page.data;
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'TechArticle',
                '@id': `${url}#article`,
                headline: page.data.title,
                description: page.data.description,
                url,
                ...(lastModified === undefined ? {} : { dateModified: lastModified.toISOString() }),
                isPartOf: { '@id': WEBSITE_ID },
                about: { '@id': SOFTWARE_ID }
            },
            { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: breadcrumbOf(page) }
        ]
    };
}

export function blogJsonLd(page: BlogPage): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: page.data.title,
        description: page.data.description,
        datePublished: page.data.date,
        dateModified: page.data.updated,
        author: { '@type': 'Person', name: page.data.author },
        url: canonicalUrl(page.url),
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': SOFTWARE_ID }
    };
}
