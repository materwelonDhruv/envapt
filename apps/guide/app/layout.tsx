import './global.css';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';

import { DEFAULT_OG_IMAGE, REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    // og/twitter title and description stay unset so Next inherits each page's resolved title and description.
    openGraph: { type: 'website', siteName: SITE_NAME, url: SITE_URL, locale: 'en_US', images: DEFAULT_OG_IMAGE },
    twitter: { card: 'summary_large_image' }
    // icons auto-detected from app/icon.svg + app/apple-icon.png (Next file convention)
};

// themeColor tints link-embed accents (Discord's side bar) and mobile browser chrome with --ev-brand.
export const viewport: Viewport = {
    themeColor: '#de6e39'
};

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    codeRepository: REPO_URL,
    programmingLanguage: 'TypeScript',
    runtimePlatform: ['Node.js', 'Bun', 'Deno'],
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
    author: { '@type': 'Person', name: 'Dhruv' }
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
    return (
        <html
            lang="en"
            className={`${sans.variable} ${mono.variable}`}
            data-scroll-behavior="smooth"
            suppressHydrationWarning
        >
            <body className="flex min-h-screen flex-col" suppressHydrationWarning>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
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
