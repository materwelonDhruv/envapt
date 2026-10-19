// the static export writes each page's markdown copy to /llms/docs/<slug>/index.md. a file named
// after the slug would collide with the directory that holds the pages under it
export const MARKDOWN_FILE = 'index.md';

const MARKDOWN_ROOT = '/llms';
const DOCS_ROOT = '/docs';

export function isDocsPage(pathname: string): boolean {
    return pathname === DOCS_ROOT || pathname.startsWith(`${DOCS_ROOT}/`);
}

export function withTrailingSlash(path: string): string {
    return path.endsWith('/') ? path : `${path}/`;
}

export function markdownPath(pagePath: string): string {
    return `${MARKDOWN_ROOT}${withTrailingSlash(pagePath)}`;
}
