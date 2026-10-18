import { markdownPath, withTrailingSlash } from './markdownFile';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://envapt.materwelon.dev';
export const SITE_NAME = 'envapt';
export const SITE_DESCRIPTION =
    'Read config as real typed values from any source, process.env, a Cloudflare Workers binding, a browser bundle, or any object you bind. Zero runtime dependencies and zod/valibot/arktype validation. Runs on Node, Bun, Deno, Cloudflare Workers, and the browser.';
export const REPO_URL = 'https://github.com/materwelonDhruv/envapt';
export const NPM_URL = 'https://www.npmjs.com/package/envapt';
export const JSR_URL = 'https://jsr.io/@materwelon/envapt';
export const AUTHOR_URL = 'https://materwelon.dev';

export const ENVAPT_VERSION = process.env.NEXT_PUBLIC_ENVAPT_VERSION ?? '';

export function npmVersionUrl(version: string): string {
    return `${NPM_URL}/v/${version}`;
}

export function npmTagForSite(siteUrl: string): 'next' | 'latest' {
    return siteUrl.includes('next-envapt') ? 'next' : 'latest';
}

// the next deploy sets this to 'next'. the nav then links that branch's CHANGELOG.md
export const REPO_REF = process.env.NEXT_PUBLIC_CHANGELOG_REF ?? 'main';
export const CHANGELOG_URL = `${REPO_URL}/blob/${REPO_REF}/packages/envapt/CHANGELOG.md`;

export function absoluteUrl(path: string): string {
    return new URL(path, SITE_URL).toString();
}

export function canonicalUrl(path: string): string {
    return absoluteUrl(withTrailingSlash(path));
}

export function markdownUrl(pagePath: string): string {
    return absoluteUrl(markdownPath(pagePath));
}
