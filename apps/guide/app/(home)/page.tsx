import { ComponentEmbed } from 'discord-component-embed/react';

import { AnyRuntime } from '@/components/AnyRuntime';
import { ClosingCta } from '@/components/ClosingCta';
import { ConverterShowcase } from '@/components/ConverterShowcase';
import { EnvLoading } from '@/components/EnvLoading';
import { Hero } from '@/components/Hero';
import { PreviewCard } from '@/components/PreviewCard';
import { StartupCheck } from '@/components/StartupCheck';
import { TwoWays } from '@/components/TwoWays';
import { HOME_PREVIEW } from '@/lib/linkPreview';
import { pageMetadata } from '@/lib/metadata';
import { DEFAULT_OG } from '@/lib/og/images';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const homeTitle = `${SITE_NAME} · ${SITE_TAGLINE}`;

export const metadata: Metadata = {
    ...pageMetadata({ title: homeTitle, path: '/', image: DEFAULT_OG, type: 'website' }),
    title: { absolute: homeTitle }
};

export default function HomePage(): ReactNode {
    return (
        <main className="flex flex-1 flex-col">
            <ComponentEmbed>
                <PreviewCard {...HOME_PREVIEW} />
            </ComponentEmbed>
            <Hero />
            <ConverterShowcase />
            <StartupCheck />
            <TwoWays />
            <AnyRuntime />
            <EnvLoading />
            <ClosingCta />
        </main>
    );
}
