import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
    reactStrictMode: true,
    // typescript + twoslash run at build time only (in transformerTwoslash); keep them out of the bundle
    serverExternalPackages: ['typescript', 'twoslash']
    // root custom domain (envapt.materwelon.dev) => no basePath / assetPrefix
};

export default withMDX(config);
