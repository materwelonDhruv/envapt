export const SITE_URL = 'https://envapt.materwelon.dev';
export const SITE_NAME = 'envapt';
export const SITE_DESCRIPTION =
    'Read environment variables as real types, with zero runtime dependencies and zod/valibot/arktype validation. Runs on Node, Bun, Deno, Cloudflare Workers, and the browser; loads .env files on Node, Bun, and Deno.';
export const REPO_URL = 'https://github.com/materwelonDhruv/envapt';
export const DEFAULT_OG_IMAGE = '/og/image.png';

export function canonicalUrl(path: string): string {
    const withSlash = path.endsWith('/') ? path : `${path}/`;
    return new URL(withSlash, SITE_URL).toString();
}
