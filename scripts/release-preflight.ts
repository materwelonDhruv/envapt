import { execFileSync } from 'node:child_process';
import console from 'node:console';
import fs from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const repoRoot = resolve(import.meta.dirname, '..');

const readPre = (): { mode: string; tag: string | undefined } => {
    const preJsonPath = resolve(repoRoot, '.changeset/pre.json');
    if (!fs.existsSync(preJsonPath)) return { mode: 'exit', tag: undefined };
    const preJson = JSON.parse(fs.readFileSync(preJsonPath, 'utf-8')) as Record<string, unknown>;
    const mode = typeof preJson.mode === 'string' ? preJson.mode : 'exit';
    const tag = typeof preJson.tag === 'string' ? preJson.tag : undefined;
    return { mode, tag };
};

const isPrerelease = (version: string): boolean => /^\d+\.\d+\.\d+-/.test(version);

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
        // a 404 and an unreachable registry both count as not-confirmed-published
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

const readDenoConfig = (): { name: string; version: string } => {
    const denoPath = resolve(repoRoot, 'packages/envapt/deno.json');
    const deno = JSON.parse(fs.readFileSync(denoPath, 'utf-8')) as Record<string, unknown>;
    const { name, version } = deno;
    if (typeof name !== 'string' || typeof version !== 'string') {
        throw new Error('packages/envapt/deno.json is missing a string name or version');
    }
    return { name, version };
};

const isVersionOnJsr = (name: string, version: string): boolean => {
    try {
        const meta = execFileSync('curl', ['-fsSL', `https://jsr.io/${name}/meta.json`], { encoding: 'utf-8' });
        const parsed = JSON.parse(meta) as { versions?: Record<string, unknown> };
        return parsed.versions !== undefined && version in parsed.versions;
    } catch {
        // deno publish skips a version already on jsr, so a duplicate attempt is a safe no-op. returning
        // false here to attempt the publish so we don't accidentally drop a release.
        return false;
    }
};

const setOutput = (key: string, value: string): void => {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (outputPath) fs.appendFileSync(outputPath, `${key}=${value}\n`);
};

const branch = process.env.GITHUB_REF_NAME ?? '';
const { mode, tag } = readPre();
const { name, version } = readEnvaptPackage();
console.log(`branch=${branch} pre-mode=${mode} tag=${tag ?? '(none)'} version=${version}`);

// both the tag and the version are asserted so neither a stray pre tag nor a forgotten `pre exit`
// can ship a prerelease to the `latest` channel
if (branch === 'next') {
    if (mode !== 'pre') {
        console.error(
            `::error::next must be in changeset pre-mode (pre.json mode=pre); got '${mode}'. Refusing to publish.`
        );
        process.exit(1);
    }
    if (!tag || tag === 'latest') {
        console.error(
            `::error::next pre-mode tag must be a dedicated prerelease channel, never 'latest'; got '${tag ?? '(none)'}'. Refusing to publish.`
        );
        process.exit(1);
    }
}
if (branch === 'main') {
    if (mode === 'pre') {
        console.error('::error::main must not be in pre-mode. Refusing to publish a prerelease to the latest tag.');
        process.exit(1);
    }
    if (isPrerelease(version)) {
        console.error(
            `::error::main version '${version}' is a prerelease. Run \`changeset pre exit\` before merging to main. Refusing to publish a prerelease to the latest tag.`
        );
        process.exit(1);
    }
}

const pendingChangesets = hasPendingChangesets();
const needsPublish = !isVersionPublished(name, version);
const run = pendingChangesets || needsPublish;

console.log(`pendingChangesets=${pendingChangesets} needsPublish=${needsPublish} (${name}@${version}) run=${run}`);
setOutput('run', String(run));

// publish whenever the version is not yet on jsr. changeset pre mode keeps the .md files after a
// prerelease is versioned, so a pending-changesets check would never let jsr publish.
const { name: jsrName, version: jsrVersion } = readDenoConfig();
const publishJsr = !isVersionOnJsr(jsrName, jsrVersion);
console.log(`jsr ${jsrName}@${jsrVersion} publish_jsr=${publishJsr}`);
setOutput('publish_jsr', String(publishJsr));
