import { ClosingCta } from '@/components/ClosingCta';
import { ConverterShowcase } from '@/components/ConverterShowcase';
import { EnvLoading } from '@/components/EnvLoading';
import { Hero } from '@/components/Hero';
import { TwoWays } from '@/components/TwoWays';
import { canonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const homeTitle = 'envapt · Typed config, straight from .env';

export const metadata: Metadata = {
    title: { absolute: homeTitle },
    alternates: { canonical: canonicalUrl('/') },
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        url: canonicalUrl('/'),
        locale: 'en_US',
        title: homeTitle,
        images: DEFAULT_OG_IMAGE
    }
};

export default function HomePage(): ReactNode {
    return (
        <main className="flex flex-1 flex-col">
            <Hero />
            <TwoWays />
            <ConverterShowcase />
            <EnvLoading />
            <ClosingCta />
        </main>
    );
}
