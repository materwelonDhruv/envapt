import './global.css';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';

import { AgentLinks } from '@/components/AgentLinks';
import { JsonLd } from '@/components/JsonLd';
import { ogImages } from '@/lib/metadata';
import { DEFAULT_OG } from '@/lib/og/images';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { siteJsonLd } from '@/lib/structuredData';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });
// google's JetBrains Mono subsets leave out the box-drawing block the guide's tree diagrams use
const monoBoxDrawing = localFont({
    src: './fonts/JetBrainsMono-Regular.woff2',
    variable: '--font-jetbrains-box',
    display: 'swap',
    adjustFontFallback: false,
    declarations: [{ prop: 'unicode-range', value: 'U+2500-257F' }]
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        url: SITE_URL,
        locale: 'en_US',
        images: ogImages(DEFAULT_OG)
    },
    twitter: { card: 'summary_large_image' },
    verification: { google: 'zqIImWHhuFI0Yd5Ej2SMF0EYRtVB9zcjMumS2-yaDJ4' }
};

export const viewport: Viewport = {
    themeColor: '#de6e39'
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
    return (
        <html
            lang="en"
            className={`${sans.variable} ${mono.variable} ${monoBoxDrawing.variable}`}
            data-scroll-behavior="smooth"
            suppressHydrationWarning
        >
            <body className="flex min-h-screen flex-col" suppressHydrationWarning>
                <AgentLinks />
                <JsonLd data={siteJsonLd()} />
                <RootProvider
                    theme={{ defaultTheme: 'dark', enableSystem: false }}
                    search={{ options: { type: 'static' } }}
                >
                    {children}
                </RootProvider>
            </body>
        </html>
    );
}
