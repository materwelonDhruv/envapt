import envaptPkg from 'envapt/package.json' with { type: 'json' };
import { createMDX } from 'fumadocs-mdx/next';

import { SITE_URL, npmTagForSite } from './lib/site';

import type { NextConfig } from 'next';

const withMDX = createMDX();

const localVersion = envaptPkg.version;

// baked at build time
async function badgeVersion(): Promise<string> {
    const injected = process.env.ENVAPT_BADGE_VERSION?.trim();
    if (injected) return injected;

    const tag = npmTagForSite(SITE_URL);
    try {
        const res = await fetch('https://registry.npmjs.org/-/package/envapt/dist-tags');
        if (!res.ok) return localVersion;
        const tags = (await res.json()) as Record<string, string>;
        return tags[tag] ?? localVersion;
    } catch {
        return localVersion;
    }
}

async function nextConfig(): Promise<NextConfig> {
    const config: NextConfig = {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
        reactStrictMode: true,
        env: { NEXT_PUBLIC_ENVAPT_VERSION: await badgeVersion() },
        // only transformerTwoslash loads typescript, during the build
        serverExternalPackages: ['typescript']
    };
    return withMDX(config);
}

export default nextConfig;
