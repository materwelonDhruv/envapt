import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const root = path.resolve(import.meta.dirname, '..');
const execFileAsync = promisify(execFile);
const HEX_RADIX = 16;
const DEBUG_ENV_VAR = 'RELEASE_METADATA_DEBUG';

const debug = (message: string): void => {
    if (process.env[DEBUG_ENV_VAR] === '1') {
        process.stderr.write(`[release-metadata] ${message}\n`);
    }
};

interface ChangesetRelease {
    name?: string | null;
}

interface ChangesetStatus {
    releases?: (ChangesetRelease | null)[];
}

const extractReleaseCountFromStatus = (raw: string | undefined): number | null => {
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as ChangesetStatus;
        const releases = parsed.releases ?? [];
        const count = releases.filter((release) => typeof release?.name === 'string').length;
        return Number.isFinite(count) ? count : null;
    } catch {
        return null;
    }
};

const readChangesetReleaseCount = async (): Promise<number | null> => {
    const statusFileRelative = path.join(
        '.changeset',
        `status-${Date.now()}-${Math.random().toString(HEX_RADIX).slice(2)}.json`
    );
    const statusFileAbsolute = path.join(root, statusFileRelative);

    debug(`Collecting changeset status into ${statusFileAbsolute}`);

    try {
        await execFileAsync('pnpm', ['changeset', 'status', '--output', statusFileRelative], { cwd: root }).catch(
            (error) => {
                const message = error instanceof Error ? error.message : String(error);
                debug(`changeset status command failed: ${message}`);
                // Ignore failures; the file may still contain useful data.
            }
        );
        const raw = await fs.readFile(statusFileAbsolute, 'utf8');
        debug(`Raw changeset status payload: ${raw}`);
        return extractReleaseCountFromStatus(raw);
    } catch {
        debug('Failed to read or parse changeset status payload.');
        return null;
    } finally {
        await fs.rm(statusFileAbsolute, { force: true }).catch(() => undefined);
    }
};

const main = async (): Promise<void> => {
    const releaseCount = await readChangesetReleaseCount();
    const hasValidCount = typeof releaseCount === 'number' && releaseCount >= 0;
    const noun = releaseCount === 1 ? 'package' : 'packages';
    const title = hasValidCount
        ? `chore(release): publish ${releaseCount} ${noun}`
        : 'chore(release): publish packages';

    process.stdout.write(`title=${title}\n`);
};

void main();
