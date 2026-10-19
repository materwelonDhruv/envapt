import { isMarkdownPreferred } from 'fumadocs-core/negotiation';

import { agentLinkHeader } from './lib/agentLinks';
import { isDocsPage, MARKDOWN_FILE, markdownPath, withTrailingSlash } from './lib/markdownFile';

interface Env {
    ASSETS: { fetch(request: Request): Promise<Response> };
}

const PRODUCTION_HOST = 'envapt.materwelon.dev';

const TRAILING_SLASH_REDIRECT = 307;
const PERMANENT_REDIRECT = 308;

const MARKDOWN = 'text/markdown; charset=utf-8';

// published v8 type definitions link these pages from editor hovers
const MOVED_PAGES: Record<string, string> = {
    '/docs/strict-mode': '/docs/required-values/#strict-mode',
    '/docs/configuration': '/docs/env-files/'
};

function movedPage(pathname: string): string | undefined {
    return MOVED_PAGES[pathname.endsWith('/') ? pathname.slice(0, -1) : pathname];
}

function at(request: Request, pathname: string): Request {
    const url = new URL(request.url);
    url.pathname = pathname;
    return new Request(url.toString(), request);
}

// fumadocs also treats text/plain as markdown by default
function wantsMarkdown(request: Request): boolean {
    return isMarkdownPreferred(request, { markdownMediaTypes: ['text/markdown'] });
}

function markdownFileIn(path: string): string {
    return path.endsWith(`/${MARKDOWN_FILE}`) ? path : `${withTrailingSlash(path)}${MARKDOWN_FILE}`;
}

async function markdownCopy(env: Env, request: Request, path: string): Promise<Response> {
    const md = await env.ASSETS.fetch(at(request, markdownFileIn(path)));
    if (!md.ok) return md;
    return new Response(md.body, { status: md.status, headers: { 'content-type': MARKDOWN } });
}

async function page(env: Env, request: Request, pathname: string): Promise<Response> {
    if (isDocsPage(pathname) && wantsMarkdown(request)) {
        const md = await markdownCopy(env, request, markdownPath(pathname));
        if (md.ok) return md;
    }

    const asset = await env.ASSETS.fetch(request);
    return asset.status === TRAILING_SLASH_REDIRECT && asset.headers.has('location')
        ? new Response(null, { status: PERMANENT_REDIRECT, headers: asset.headers })
        : asset;
}

const handler = {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        const moved = movedPage(url.pathname);
        if (moved !== undefined) return Response.redirect(new URL(moved, url).toString(), PERMANENT_REDIRECT);

        if (url.pathname.startsWith('/llms/docs/')) return markdownCopy(env, request, url.pathname);

        const served = await page(env, request, url.pathname);
        const contentType = served.headers.get('content-type') ?? '';
        const isHtml = contentType.includes('text/html');
        const isNegotiated = isHtml || contentType.startsWith('text/markdown');
        const isProductionHost = url.hostname === PRODUCTION_HOST;

        if (isProductionHost && !isNegotiated) return served;

        const response = new Response(served.body, served);
        if (isHtml) {
            response.headers.set(
                'Link',
                agentLinkHeader(url.origin, isDocsPage(url.pathname) ? url.pathname : undefined)
            );
        }
        // a cache that ignores Accept would serve the markdown to a browser
        if (isNegotiated && isDocsPage(url.pathname)) response.headers.set('Vary', 'Accept');
        if (!isProductionHost) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return response;
    }
};

export default handler;
