export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://envapt.materwelon.dev';
export const SITE_NAME = 'envapt';
export const SITE_DESCRIPTION =
    'Read config as real typed values from any source, process.env, a Cloudflare Workers binding, a browser bundle, or any object you bind. Zero runtime dependencies and zod/valibot/arktype validation. Runs on Node, Bun, Deno, Cloudflare Workers, and the browser.';
export const REPO_URL = 'https://github.com/materwelonDhruv/envapt';
export const NPM_URL = 'https://www.npmjs.com/package/envapt';
export const DEFAULT_OG_IMAGE = '/og/image.png';

export const ENVAPT_VERSION = process.env.NEXT_PUBLIC_ENVAPT_VERSION ?? '';

export function canonicalUrl(path: string): string {
    const withSlash = path.endsWith('/') ? path : `${path}/`;
    return new URL(withSlash, SITE_URL).toString();
}
