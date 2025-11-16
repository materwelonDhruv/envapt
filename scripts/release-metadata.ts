import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const root = path.resolve(import.meta.dirname, '..');
const packageJsonPath = path.join(root, 'package.json');
const execFileAsync = promisify(execFile);
const HEX_RADIX = 16;
const DEBUG_ENV_VAR = 'RELEASE_METADATA_DEBUG';

const debug = (message: string): void => {
    if (process.env[DEBUG_ENV_VAR] === '1') {
        process.stderr.write(`[release-metadata] ${message}\n`);
    }
};

interface ChangesetStatus {
    releases?: ({ newVersion?: string | null } | null)[];
}

const extractVersionFromStatus = (raw: string | undefined): string | null => {
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as ChangesetStatus;
        const firstRelease = parsed.releases?.find((release) => release?.newVersion);
        const version = firstRelease?.newVersion;
        return typeof version === 'string' && version.trim().length > 0 ? version : null;
    } catch {
        return null;
    }
};

const readChangesetVersion = async (): Promise<string | null> => {
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
        return extractVersionFromStatus(raw);
    } catch {
        debug('Failed to read or parse changeset status payload. Falling back to package version.');
        return null;
    } finally {
        await fs.rm(statusFileAbsolute, { force: true }).catch(() => undefined);
    }
};

const readPackageVersion = async (): Promise<string | null> => {
    try {
        const raw = await fs.readFile(packageJsonPath, 'utf8');
        const pkg = JSON.parse(raw) as { version?: string };
        return typeof pkg.version === 'string' && pkg.version.trim().length > 0 ? pkg.version : null;
    } catch (error) {
        throw new Error(`Failed to read package.json: ${(error as Error).message}`);
    }
};

const main = async (): Promise<void> => {
    const version = (await readChangesetVersion()) ?? (await readPackageVersion());

    const title = version ? `Release v${version}` : 'Release Packages';

    process.stdout.write(`version=${version ?? ''}\n`);
    process.stdout.write(`title=${title}\n`);
};

void main();
