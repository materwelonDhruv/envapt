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

interface Ctx {
    owner: string;
    repo: string;
    pr: number;
    sha: string;
    token: string;
}

function readCtx(): Ctx {
    const repository = Envapter.getUsing('GITHUB_REPOSITORY', { converter: Converters.String, required: true });
    const pr = Envapter.getUsing('PR_NUMBER', { converter: Converters.Number, required: true });
    const sha = Envapter.getUsing('HEAD_SHA', { converter: Converters.String, required: true });
    const token = Envapter.getUsing('GITHUB_TOKEN', { converter: Converters.String, required: true });

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) throw new Error('[semver-label] GITHUB_REPOSITORY must be "owner/repo"');
    return { owner, repo, pr, sha, token };
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

async function changesetBodies(ctx: Ctx): Promise<string[]> {
    const list = await api(ctx.token, 'GET', `/repos/${ctx.owner}/${ctx.repo}/contents/.changeset?ref=${ctx.sha}`);
    if (!list.ok) return [];
    // justified: GitHub "get directory contents" returns an array of entries
    const entries = (await list.json()) as { type: string; name: string; path: string }[];
    const bodies: string[] = [];
    for (const entry of entries) {
        if (entry.type !== 'file' || !entry.name.endsWith('.md') || entry.name === 'README.md') continue;
        const file = await api(
            ctx.token,
            'GET',
            `/repos/${ctx.owner}/${ctx.repo}/contents/${entry.path}?ref=${ctx.sha}`
        );
        if (!file.ok) continue;
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
