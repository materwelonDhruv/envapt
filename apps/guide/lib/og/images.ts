import { snippetFor } from './snippets';

// a plain route like app/og/route.tsx exports a file with no extension, served with the wrong content-type
export const OG_FILE = 'image.png';

export interface OgImage {
    path: string;
    alt: string;
}

const DEFAULT_ALT = 'The envapt card reading "Typed config, from any source", above the command pnpm add envapt';

export const DEFAULT_OG: OgImage = { path: `/og/${OG_FILE}`, alt: DEFAULT_ALT };

export function docsOgImage(slugs: readonly string[], title: string): OgImage {
    const snippet = snippetFor(slugs);
    return {
        path: `/docs-og/${[...slugs, OG_FILE].join('/')}`,
        alt:
            snippet === undefined
                ? DEFAULT_ALT
                : `A code editor open on ${snippet.filename}, showing the envapt example for ${title}`
    };
}

export function blogOgImage(slug: string, title: string): OgImage {
    return { path: `/blog-og/${slug}/${OG_FILE}`, alt: `The envapt blog card reading "${title}"` };
}
