import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

interface Changeset {
    summary: string;
    commit?: string;
}

interface ChangelogOptions {
    repo?: string;
}

const run = promisify(execFile);

// github puts the pull request number at the end of a squash merge subject
const PULL_NUMBER = /\(#(\d+)\)$/;
const SHORT_SHA = 7;

async function subjectOf(sha: string): Promise<string> {
    try {
        const { stdout } = await run('git', ['log', '-1', '--format=%s', sha]);
        return stdout.trim();
    } catch {
        return '';
    }
}

async function referenceFor(sha: string, repo: string): Promise<string> {
    const base = `https://github.com/${repo}`;
    const pull = PULL_NUMBER.exec(await subjectOf(sha))?.[1];
    if (pull !== undefined) return `[#${pull}](${base}/pull/${pull})`;

    return `[\`${sha.slice(0, SHORT_SHA)}\`](${base}/commit/${sha})`;
}

async function getReleaseLine(changeset: Changeset, _type: string, options: ChangelogOptions | null): Promise<string> {
    const repo = options?.repo;
    if (repo === undefined) {
        throw new Error(
            'changelog config needs a repo, as in ["../scripts/release/changelog.ts", { "repo": "owner/name" }]'
        );
    }

    const [first = '', ...rest] = changeset.summary.trim().split('\n');
    const continuation = rest.map((line) => (line === '' ? '' : `  ${line}`)).join('\n');
    const text = rest.length > 0 ? `${first}\n${continuation}` : first;
    if (changeset.commit === undefined) return `- ${text}`;

    return `- ${text} (${await referenceFor(changeset.commit, repo)})`;
}

export default {
    getReleaseLine,
    getDependencyReleaseLine: (): Promise<string> => Promise.resolve('')
};
