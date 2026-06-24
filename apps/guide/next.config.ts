import { readFileSync } from 'node:fs';

import { createMDX } from 'fumadocs-mdx/next';

import type { NextConfig } from 'next';

const withMDX = createMDX();

const { version: localVersion } = JSON.parse(
    readFileSync(new URL('../../packages/envapt/package.json', import.meta.url), 'utf8')
) as { version: string };

// next site shows the npm next tag, prod shows latest. baked so React renders it, an edge injection gets clobbered by hydration. falls back to package.json
async function badgeVersion(): Promise<string> {
    const tag = process.env.NEXT_PUBLIC_SITE_URL?.includes('next-envapt') ? 'next' : 'latest';
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
        // typescript + twoslash run at build time only (in transformerTwoslash); keep them out of the bundle
        serverExternalPackages: ['typescript', 'twoslash']
    };
    return withMDX(config);
}

export default nextConfig;
