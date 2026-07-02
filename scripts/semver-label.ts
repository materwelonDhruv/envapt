/**
 * Applies one semver label (🩹 patch / ✨ minor / 💥 major) to a pull request from its changeset bumps.
 * The semver-labeler workflow runs this with `tsx`. The token, repo, PR number, and head sha come from env.
 */
import { fileURLToPath } from 'node:url';

import { Envapter, Converters } from 'envapt';

const RANK = { patch: 1, minor: 2, major: 3 } as const;
type Bump = keyof typeof RANK;
const LABEL: Record<Bump, string> = { patch: '🩹 patch', minor: '✨ minor', major: '💥 major' };

/** The highest semver bump across a set of changeset file bodies, or null when none carry one. */
export function maxBump(changesets: string[]): Bump | null {
    let top: Bump | null = null;
    for (const body of changesets) {
        const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(body);
        if (!frontmatter) continue;
        for (const line of (frontmatter[1] ?? '').split('\n')) {
            const value = line.split(':').pop()?.trim().replace(/['"]/g, '');
            if (value && value in RANK && (top === null || RANK[value as Bump] > RANK[top])) {
                top = value as Bump;
            }
        }
    }
    return top;
}

/** The changeset files this PR adds or edits. */
export function changesetPathsFromFiles(files: { filename: string; status: string }[]): string[] {
    return files
        .filter((file) => {
            const name = file.filename.split('/').pop() ?? '';
            const touched = file.status === 'added' || file.status === 'modified';
            return file.filename.startsWith('.changeset/') && name.endsWith('.md') && name !== 'README.md' && touched;
        })
        .map((file) => file.filename);
}

interface Ctx {
    owner: string;
    repo: string;
    pr: number;
    sha: string;
    token: string;
}

function readCtx(): Ctx {
    const env = Envapter.getRequiredAll({
        GITHUB_REPOSITORY: Converters.String,
        PR_NUMBER: Converters.Number,
        HEAD_SHA: Converters.String,
        GITHUB_TOKEN: Converters.String
    });

    const [owner, repo] = env.GITHUB_REPOSITORY.split('/');
    if (!owner || !repo) throw new Error('[semver-label] GITHUB_REPOSITORY must be "owner/repo"');
    return { owner, repo, pr: env.PR_NUMBER, sha: env.HEAD_SHA, token: env.GITHUB_TOKEN };
}

function api(token: string, method: string, path: string, body?: unknown): Promise<Response> {
    return fetch(`https://api.github.com${path}`, {
        method,
        headers: {
            authorization: `Bearer ${token}`,
            accept: 'application/vnd.github+json',
            'x-github-api-version': '2022-11-28',
            ...(body === undefined ? {} : { 'content-type': 'application/json' })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
}

async function prChangedFiles(ctx: Ctx): Promise<{ filename: string; status: string }[]> {
    const files: { filename: string; status: string }[] = [];
    for (let page = 1; ; page++) {
        const res = await api(
            ctx.token,
            'GET',
            `/repos/${ctx.owner}/${ctx.repo}/pulls/${ctx.pr}/files?per_page=100&page=${page}`
        );
        // a failed listing must stop the job, an empty list here would silently apply no label.
        if (!res.ok)
            throw new Error(`[semver-label] listing PR #${ctx.pr} files failed: ${res.status} ${res.statusText}`);
        // justified: GitHub "list pull request files" returns an array of file entries
        const pageFiles = (await res.json()) as { filename: string; status: string }[];
        files.push(...pageFiles);
        if (pageFiles.length < 100) break;
    }
    return files;
}

async function changesetBodies(ctx: Ctx): Promise<string[]> {
    const bodies: string[] = [];
    for (const path of changesetPathsFromFiles(await prChangedFiles(ctx))) {
        const file = await api(ctx.token, 'GET', `/repos/${ctx.owner}/${ctx.repo}/contents/${path}?ref=${ctx.sha}`);
        // same reason as the listing, a skipped changeset would drop its bump and mislabel the PR.
        if (!file.ok) throw new Error(`[semver-label] reading ${path} failed: ${file.status} ${file.statusText}`);
        // justified: GitHub "get file contents" returns base64 content
        const { content } = (await file.json()) as { content: string };
        bodies.push(Buffer.from(content, 'base64').toString('utf8'));
    }
    return bodies;
}

async function main(): Promise<void> {
    const ctx = readCtx();
    const bump = maxBump(await changesetBodies(ctx));
    const want = bump ? LABEL[bump] : null;
    const res = await api(ctx.token, 'GET', `/repos/${ctx.owner}/${ctx.repo}/issues/${ctx.pr}/labels`);
    // justified: GitHub "list labels on an issue" returns an array of labels
    const current = ((await res.json()) as { name: string }[]).map((label) => label.name);
    for (const stale of Object.values(LABEL)) {
        if (stale !== want && current.includes(stale)) {
            await api(
                ctx.token,
                'DELETE',
                `/repos/${ctx.owner}/${ctx.repo}/issues/${ctx.pr}/labels/${encodeURIComponent(stale)}`
            );
        }
    }
    if (want && !current.includes(want)) {
        await api(ctx.token, 'POST', `/repos/${ctx.owner}/${ctx.repo}/issues/${ctx.pr}/labels`, { labels: [want] });
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    void main();
}
