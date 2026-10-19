import { OG_SIZE } from '@/lib/og/theme';
import { absoluteUrl, canonicalUrl, markdownUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

import type { OgImage } from '@/lib/og/images';
import type { Metadata } from 'next';

interface PageMetadataOptions {
    title: string;
    description?: string | undefined;
    path: string;
    image: OgImage;
    type: 'article' | 'website';
    hasMarkdownCopy?: boolean;
}

export function ogImages(image: OgImage): { url: string; width: number; height: number; alt: string }[] {
    return [{ url: absoluteUrl(image.path), ...OG_SIZE, alt: image.alt }];
}

export function pageMetadata({
    title,
    description,
    path,
    image,
    type,
    hasMarkdownCopy = false
}: PageMetadataOptions): Metadata {
    const url = canonicalUrl(path);
    const summary = description ?? SITE_DESCRIPTION;
    const images = ogImages(image);

    return {
        title,
        description: summary,
        alternates: {
            canonical: url,
            types: hasMarkdownCopy ? { 'text/markdown': markdownUrl(path) } : undefined
        },
        openGraph: { type, siteName: SITE_NAME, url, locale: 'en_US', title, description: summary, images },
        twitter: { card: 'summary_large_image', title, description: summary, images }
    };
}
