interface Env {
    ASSETS: { fetch(request: Request): Promise<Response> };
}

const PRODUCTION_HOST = 'envapt.materwelon.dev';

const TRAILING_SLASH_REDIRECT = 307;
const PERMANENT_REDIRECT = 308;

const AGENT_LINK = '</llms.txt>; rel="alternate"; type="text/plain"';

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

        const response = new Response(normalized.body, normalized);
        if (isHtml) response.headers.append('Link', AGENT_LINK);
        if (!isProductionHost) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return response;
    }
};

export default handler;
