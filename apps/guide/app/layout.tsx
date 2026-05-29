import './global.css';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
    title: { default: 'envapt', template: '%s · envapt' },
    description:
        'Read environment variables as real types. Zero runtime dependencies, the same API on Node, Bun, and Deno.'
    // icons auto-detected from app/icon.svg + app/apple-icon.png (Next file convention)
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
    return (
        <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
            <body className="flex min-h-screen flex-col" suppressHydrationWarning>
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
