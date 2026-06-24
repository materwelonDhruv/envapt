interface Env {
    ASSETS: { fetch(request: Request): Promise<Response> };
}

interface RewriterElement {
    setInnerContent(content: string): void;
}
interface RewriterInstance {
    on(selector: string, handlers: { element(element: RewriterElement): void }): RewriterInstance;
    transform(response: Response): Response;
}
declare const HTMLRewriter: new () => RewriterInstance;

const PRODUCTION_HOST = 'envapt.materwelon.dev';
const NEXT_HOST = 'next-envapt.materwelon.dev';

const TRAILING_SLASH_REDIRECT = 307;
const PERMANENT_REDIRECT = 308;

const AGENT_LINK = '</llms.txt>; rel="alternate"; type="text/plain"';

const DIST_TAGS_URL = 'https://registry.npmjs.org/-/package/envapt/dist-tags';
const VERSION_TTL_MS = 3_600_000;

function versionTagForHost(hostname: string): 'latest' | 'next' | null {
    if (hostname === PRODUCTION_HOST) return 'latest';
    if (hostname === NEXT_HOST) return 'next';
    return null;
}

let versionCache: { tag: string; version: string; until: number } | undefined;

async function liveVersion(tag: 'latest' | 'next'): Promise<string | null> {
    const now = Date.now();
    if (versionCache?.tag === tag && versionCache.until > now) return versionCache.version;

    try {
        const res = await fetch(DIST_TAGS_URL);
        if (!res.ok) return null;
        const tags = (await res.json()) as Record<string, string>;
        const version = tags[tag];
        if (!version) return null;
        versionCache = { tag, version, until: now + VERSION_TTL_MS };
        return version;
    } catch {
        return null;
    }
}

const handler = {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/llms/docs/')) {
            const target = new URL(request.url);
            if (target.pathname.endsWith('/')) target.pathname = target.pathname.slice(0, -1);
            const md = await env.ASSETS.fetch(new Request(target.toString(), request));
            if (!md.ok) return md;
            return new Response(md.body, {
                status: md.status,
                headers: { 'content-type': 'text/markdown; charset=utf-8' }
            });
        }

        const asset = await env.ASSETS.fetch(request);

        const normalized =
            asset.status === TRAILING_SLASH_REDIRECT && asset.headers.has('location')
                ? new Response(null, { status: PERMANENT_REDIRECT, headers: asset.headers })
                : asset;

        const isProductionHost = url.hostname === PRODUCTION_HOST;
        const isHtml = normalized.headers.get('content-type')?.includes('text/html') ?? false;

        if (isProductionHost && !isHtml) return normalized;

        let response = new Response(normalized.body, normalized);
        if (isHtml) response.headers.append('Link', AGENT_LINK);
        if (!isProductionHost) response.headers.set('X-Robots-Tag', 'noindex, nofollow');

        const tag = isHtml ? versionTagForHost(url.hostname) : null;
        if (tag) {
            const version = await liveVersion(tag);
            if (version) {
                response = new HTMLRewriter()
                    .on('[data-envapt-version]', {
                        element(element) {
                            element.setInnerContent(`v${version}`);
                        }
                    })
                    .transform(response);
            }
        }

        return response;
    }
};

export default handler;
