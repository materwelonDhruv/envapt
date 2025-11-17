import console from 'node:console';
import fs from 'node:fs';
import { resolve } from 'node:path';

const getPackageVersion = (packageJsonPath: string, label: string): string | null => {
    if (!fs.existsSync(packageJsonPath)) {
        console.warn(`package.json not found for ${label}, skipping`);
        return null;
    }

    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
        const packageVersion = packageJson.version;

        if (typeof packageVersion !== 'string' || packageVersion.length === 0) {
            throw new Error('Version not found in package.json');
        }

        return packageVersion;
    } catch (error) {
        console.error(`Failed to read package.json for ${label}:`, error);
        return null;
    }
};

const formatVersion = (value: unknown): string => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }

    if (value === undefined || value === null) {
        return 'unknown';
    }

    try {
        return JSON.stringify(value);
    } catch {
        return 'unknown';
    }
};

const syncVersion = (denoConfigPath: string, label: string, packageVersion: string): void => {
    try {
        const denoJson = JSON.parse(fs.readFileSync(denoConfigPath, 'utf-8')) as Record<string, unknown>;
        const denoConfig = {
            ...denoJson,
            version: packageVersion
        };

        // eslint-disable-next-line no-magic-numbers
        fs.writeFileSync(denoConfigPath, `${JSON.stringify(denoConfig, null, 4)}\n`, 'utf-8');

        console.log(
            `JSR publish version updated from ${formatVersion(denoJson.version)} to ${packageVersion} in ${label}`
        );
    } catch (error) {
        console.error(`Failed to update ${label}:`, error);
    }
};

const repoRoot = resolve(import.meta.dirname, '..');
const rootPackageJsonPath = resolve(repoRoot, 'package.json');
const rootVersion = getPackageVersion(rootPackageJsonPath, 'repository root');

const rootDenoConfigPath = resolve(repoRoot, 'deno.json');
if (rootVersion && fs.existsSync(rootDenoConfigPath)) {
    syncVersion(rootDenoConfigPath, 'deno.json', rootVersion);
}

const packagesDir = resolve(repoRoot, 'packages');
if (fs.existsSync(packagesDir)) {
    const packageEntries = fs.readdirSync(packagesDir, { withFileTypes: true });

    for (const entry of packageEntries) {
        if (!entry.isDirectory()) continue;

        const denoConfigPath = resolve(packagesDir, entry.name, 'deno.json');
        if (!fs.existsSync(denoConfigPath)) continue;

        const packageJsonPath = resolve(packagesDir, entry.name, 'package.json');
        const packageVersion = getPackageVersion(packageJsonPath, `packages/${entry.name}`);
        if (!packageVersion) continue;

        syncVersion(denoConfigPath, `packages/${entry.name}/deno.json`, packageVersion);
    }
}
