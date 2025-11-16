import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const packageJsonPath = path.join(root, 'package.json');

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
    const version = await readPackageVersion();

    const title = version ? `Release v${version}` : 'Release Packages';

    process.stdout.write(`version=${version ?? ''}\n`);
    process.stdout.write(`title=${title}\n`);
};

void main();
