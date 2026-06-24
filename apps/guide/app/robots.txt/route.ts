import { SITE_URL } from '@/lib/site';

export const revalidate = false;

const BODY = `# Content Signals Policy (https://contentsignals.org)
# search: building a search index and providing search results
# ai-input: inputting content into AI models for real-time use
# ai-train: training or fine-tuning AI models

User-agent: *
Content-Signal: search=yes, ai-train=yes, ai-input=yes
Allow: /

Sitemap: ${new URL('/sitemap.xml', SITE_URL).toString()}
`;

export function GET(): Response {
    return new Response(BODY, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
