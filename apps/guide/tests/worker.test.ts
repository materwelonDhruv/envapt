import { describe, expect, it } from 'vitest';

import worker from '../worker';

const assets = { fetch: async (): Promise<Response> => new Response('page', { status: 200 }) };

async function get(path: string): Promise<Response> {
    return worker.fetch(new Request(`https://envapt.materwelon.dev${path}`), { ASSETS: assets });
}

describe('moved pages', () => {
    it('sends an old slug to the page that took its content', async () => {
        const res = await get('/docs/strict-mode/');
        expect(res.status).toBe(308);
        expect(res.headers.get('location')).toBe('https://envapt.materwelon.dev/docs/required-values/#strict-mode');
    });

    it('matches the slug with or without the trailing slash', async () => {
        const res = await get('/docs/configuration');
        expect(res.headers.get('location')).toBe('https://envapt.materwelon.dev/docs/env-files/');
    });

    it('serves every other page from the assets', async () => {
        const res = await get('/docs/converters/');
        expect(res.status).toBe(200);
    });
});

const SITE = 'https://envapt.materwelon.dev';
const NOT_FOUND = 404;

// answers only the paths in present, as text/html unless the path is a markdown copy
function recording(...present: string[]): { asked: string[]; ASSETS: { fetch(request: Request): Promise<Response> } } {
    const asked: string[] = [];
    return {
        asked,
        ASSETS: {
            fetch: async (request: Request): Promise<Response> => {
                const { pathname } = new URL(request.url);
                asked.push(pathname);
                if (!present.includes(pathname)) return new Response('', { status: NOT_FOUND });
                const type = pathname.endsWith('.md') ? 'text/markdown' : 'text/html; charset=utf-8';
                return new Response(pathname, { headers: { 'content-type': type } });
            }
        }
    };
}

function asking(path: string, accept: string): Request {
    return new Request(`${SITE}${path}`, { headers: { accept } });
}

describe('discovery links', () => {
    it('points every page at llms.txt and the skills index', async () => {
        const res = await worker.fetch(new Request(`${SITE}/`), recording('/'));
        const link = res.headers.get('Link');

        expect(link).toContain(`<${SITE}/llms.txt>; rel="describedby"`);
        expect(link).toContain(`<${SITE}/.well-known/agent-skills/index.json>; rel="service-meta"`);
    });

    it('points a docs page at its markdown copy', async () => {
        const res = await worker.fetch(new Request(`${SITE}/docs/converters/`), recording('/docs/converters/'));

        expect(res.headers.get('Link')).toContain(
            `<${SITE}/llms/docs/converters/>; rel="alternate"; type="text/markdown"`
        );
    });

    it('leaves the markdown link off a page with no markdown copy', async () => {
        const res = await worker.fetch(new Request(`${SITE}/blog/`), recording('/blog/'));

        expect(res.headers.get('Link')).not.toContain('text/markdown');
    });
});

describe('markdown for a client that asks for it', () => {
    it('serves the markdown copy at the page url', async () => {
        const assets = recording('/llms/docs/converters/index.md');

        const res = await worker.fetch(asking('/docs/converters/', 'text/markdown'), assets);

        expect(assets.asked).toEqual(['/llms/docs/converters/index.md']);
        expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
        expect(res.headers.get('Vary')).toBe('Accept');
    });

    it('serves the markdown copy of the docs root', async () => {
        const assets = recording('/llms/docs/index.md');

        await worker.fetch(asking('/docs/', 'text/markdown'), assets);

        expect(assets.asked).toEqual(['/llms/docs/index.md']);
    });

    it('serves markdown when it outranks html', async () => {
        const assets = recording('/llms/docs/converters/index.md');

        await worker.fetch(asking('/docs/converters/', 'text/markdown;q=1, text/html;q=0.5'), assets);

        expect(assets.asked).toEqual(['/llms/docs/converters/index.md']);
    });

    it('leaves a browser on the html page', async () => {
        const assets = recording('/docs/converters/');

        const res = await worker.fetch(
            asking('/docs/converters/', 'text/html,application/xhtml+xml,*/*;q=0.8'),
            assets
        );

        expect(assets.asked).toEqual(['/docs/converters/']);
        expect(res.headers.get('Vary')).toBe('Accept');
    });

    it('serves the html of a page that has no markdown copy', async () => {
        const assets = recording('/blog/');

        const res = await worker.fetch(asking('/blog/', 'text/markdown'), assets);

        expect(assets.asked).toEqual(['/blog/']);
        expect(res.status).toBe(200);
    });
});

describe('markdown copies', () => {
    it.each(['/llms/docs/api', '/llms/docs/api/'])('serves %s from its index.md as markdown', async (path) => {
        const requested: string[] = [];
        const res = await worker.fetch(new Request(`https://envapt.materwelon.dev${path}`), {
            ASSETS: {
                fetch: async (request: Request): Promise<Response> => {
                    requested.push(new URL(request.url).pathname);
                    return new Response('# API reference', { status: 200 });
                }
            }
        });
        expect(requested).toEqual(['/llms/docs/api/index.md']);
        expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    });
});
