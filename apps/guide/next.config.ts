import { readFileSync } from 'node:fs';

import { createMDX } from 'fumadocs-mdx/next';

import type { NextConfig } from 'next';

const withMDX = createMDX();

// need to read from package.json because build happens before publish
const { version } = JSON.parse(readFileSync(new URL('../../packages/envapt/package.json', import.meta.url), 'utf8'));

const config: NextConfig = {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
    reactStrictMode: true,
    env: { NEXT_PUBLIC_ENVAPT_VERSION: version },
    // typescript + twoslash run at build time only (in transformerTwoslash); keep them out of the bundle
    serverExternalPackages: ['typescript', 'twoslash']
    // root custom domain (envapt.materwelon.dev) => no basePath / assetPrefix
};

export default withMDX(config);
