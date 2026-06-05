import { execFileSync } from 'node:child_process';
import console from 'node:console';
import fs from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const repoRoot = resolve(import.meta.dirname, '..');

const readPreMode = (): string => {
    const preJsonPath = resolve(repoRoot, '.changeset/pre.json');
    if (!fs.existsSync(preJsonPath)) return 'exit';
    const preJson = JSON.parse(fs.readFileSync(preJsonPath, 'utf-8')) as Record<string, unknown>;
    return typeof preJson.mode === 'string' ? preJson.mode : 'exit';
};

const hasPendingChangesets = (): boolean => {
    const changesetDir = resolve(repoRoot, '.changeset');
    if (!fs.existsSync(changesetDir)) return false;
    return fs.readdirSync(changesetDir).some((file) => file.endsWith('.md') && file !== 'README.md');
};

const isVersionPublished = (name: string, version: string): boolean => {
    try {
        execFileSync('npm', ['view', `${name}@${version}`, 'version'], { stdio: 'ignore' });
        return true;
    } catch {
        // 404 or an unreachable registry both
        return false;
    }
};

const readEnvaptPackage = (): { name: string; version: string } => {
    const pkgPath = resolve(repoRoot, 'packages/envapt/package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    const { name, version } = pkg;
    if (typeof name !== 'string' || typeof version !== 'string') {
        throw new Error('packages/envapt/package.json is missing a string name or version');
    }
    return { name, version };
};

const setOutput = (key: string, value: string): void => {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (outputPath) fs.appendFileSync(outputPath, `${key}=${value}\n`);
};

const branch = process.env.GITHUB_REF_NAME ?? '';
const mode = readPreMode();
console.log(`branch=${branch} pre-mode=${mode}`);

// `next` publishes -next.N to the `next` dist-tag and must be in changeset pre-mode.
// `main` publishes `latest` and must not be.
// so a pre.json can never ship a prerelease to `latest`.
if (branch === 'next' && mode !== 'pre') {
    console.error(
        `::error::next must be in changeset pre-mode (pre.json mode=pre); got '${mode}'. Refusing to publish.`
    );
    process.exit(1);
}
if (branch === 'main' && mode === 'pre') {
    console.error('::error::main must not be in pre-mode. Refusing to publish a prerelease to the latest tag.');
    process.exit(1);
}

// only invoke changesets/action when there is real work
const { name, version } = readEnvaptPackage();
const pendingChangesets = hasPendingChangesets();
const needsPublish = !isVersionPublished(name, version);
const run = pendingChangesets || needsPublish;

console.log(`pendingChangesets=${pendingChangesets} needsPublish=${needsPublish} (${name}@${version}) run=${run}`);
setOutput('run', String(run));
