import { describe, expect, it } from 'vitest';

import { SITE_URL } from '../lib/site';
import { source } from '../lib/source';
import { docsJsonLd, siteJsonLd } from '../lib/structuredData';

interface Node {
    '@type': string;
    [key: string]: unknown;
}

function nodesOf(slugs: string[]): Node[] {
    const page = source.getPage(slugs);
    if (!page) throw new Error(`no page at ${slugs.join('/')}`);
    return (docsJsonLd(page) as { '@graph': Node[] })['@graph'];
}

function ofType(nodes: Node[], type: string): Node | undefined {
    return nodes.find((node) => node['@type'] === type);
}

describe('docs page structured data', () => {
    it('places a page under the docs root in its breadcrumb', () => {
        const breadcrumb = ofType(nodesOf(['quick-start']), 'BreadcrumbList');

        expect(breadcrumb?.itemListElement).toEqual([
            { '@type': 'ListItem', position: 1, name: 'Docs', item: `${SITE_URL}/docs/` },
            { '@type': 'ListItem', position: 2, name: 'Quick Start', item: `${SITE_URL}/docs/quick-start/` }
        ]);
    });

    it('keeps every folder that has a page of its own', () => {
        const breadcrumb = ofType(nodesOf(['api', 'reference', 'envapt', 'classes', 'Envapter']), 'BreadcrumbList');

        expect(breadcrumb?.itemListElement).toEqual([
            expect.objectContaining({ position: 1, name: 'Docs' }),
            expect.objectContaining({ position: 2, name: 'envapt', item: `${SITE_URL}/docs/api/reference/envapt/` }),
            expect.objectContaining({ position: 3, name: 'Envapter' })
        ]);
    });

    it('lists the docs root once on its own page', () => {
        const breadcrumb = ofType(nodesOf([]), 'BreadcrumbList');

        expect(breadcrumb?.itemListElement).toEqual([expect.objectContaining({ position: 1, name: 'Docs' })]);
    });

    it('links the article to the website and software nodes the layout emits', () => {
        const article = ofType(nodesOf(['quick-start']), 'TechArticle');
        const site = (siteJsonLd() as { '@graph': Node[] })['@graph'];

        expect(article?.isPartOf).toEqual({ '@id': ofType(site, 'WebSite')?.['@id'] });
        expect(article?.about).toEqual({ '@id': ofType(site, 'SoftwareSourceCode')?.['@id'] });
    });
});
