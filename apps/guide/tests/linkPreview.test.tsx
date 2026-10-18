import { toComponentEmbedJson } from 'discord-component-embed';
import { describe, expect, it } from 'vitest';

import { PreviewCard } from '../components/PreviewCard';
import { blogPreview, docsPreview, HOME_PREVIEW } from '../lib/linkPreview';
import { blog, source } from '../lib/source';

import type { PreviewCardProps } from '../components/PreviewCard';

// throws OverLimit when the card is past discord's size limits
function cardJson(props: PreviewCardProps): string {
    return toComponentEmbedJson(<PreviewCard {...props} />);
}

describe('link preview cards', () => {
    it('places a guide page under its sidebar section', async () => {
        const page = source.getPage(['converters']);
        expect(page && (await docsPreview(page)).breadcrumb).toEqual(['guide', expect.any(String)]);
    });

    it('places an API page under its module and kind', async () => {
        const page = source.getPage(['api', 'reference', 'envapt', 'classes', 'Envapter']);
        expect(page && (await docsPreview(page)).breadcrumb).toEqual(['api', 'envapt', 'classes']);
    });

    it('places a migration page under its separator and folder', async () => {
        const page = source.getPage(['migration-v7-to-v8']);
        expect(page && (await docsPreview(page)).breadcrumb).toEqual(['guide', 'Reference', 'Migrations']);
    });

    it('describes an API page that has no summary by what it is', async () => {
        const moduleIndex = source.getPage(['api', 'reference', 'legacy']);
        const symbol = source.getPage([
            'api',
            'reference',
            'envapt',
            'namespaces',
            'StandardSchemaV1',
            'interfaces',
            'Issue'
        ]);
        expect(moduleIndex && (await docsPreview(moduleIndex)).body).toBe('The envapt/legacy module');
        expect(symbol && (await docsPreview(symbol)).body).toBe('Issue is one of the interfaces exported by envapt');
    });

    it('builds the home card', () => {
        expect(() => cardJson(HOME_PREVIEW)).not.toThrow();
    });

    it.each(source.getPages().map((page) => [page.url, page] as const))(
        'builds the card for %s',
        async (_url, page) => {
            const props = await docsPreview(page);
            expect(() => cardJson(props)).not.toThrow();
        }
    );

    it.each(blog.getPages().map((page) => [page.url, page] as const))('builds the card for %s', (_url, page) => {
        expect(() => cardJson(blogPreview(page))).not.toThrow();
    });
});
