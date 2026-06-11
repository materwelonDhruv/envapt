interface Env {
    ASSETS: { fetch(request: Request): Promise<Response> };
}

// every host other than this one serves the same content, so it gets an X-Robots-Tag noindex header to keep duplicates out of Google's index
const PRODUCTION_HOST = 'envapt.materwelon.dev';

const TRAILING_SLASH_REDIRECT = 307;
const PERMANENT_REDIRECT = 308;

const handler = {
    async fetch(request: Request, env: Env): Promise<Response> {
        const asset = await env.ASSETS.fetch(request);

        // avoid duplicate content between slash and non-slash URLs
        const normalized =
            asset.status === TRAILING_SLASH_REDIRECT && asset.headers.has('location')
                ? new Response(null, { status: PERMANENT_REDIRECT, headers: asset.headers })
                : asset;

        if (new URL(request.url).hostname === PRODUCTION_HOST) return normalized;

        const response = new Response(normalized.body, normalized);
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return response;
    }
};

export default handler;
