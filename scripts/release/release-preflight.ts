import { execFileSync } from 'node:child_process';
import console from 'node:console';
import fs from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { publishGuardError } from './release-guards';

const repoRoot = resolve(import.meta.dirname, '..', '..');

const readPre = (): { mode: string; tag: string | undefined } => {
    const preJsonPath = resolve(repoRoot, '.changeset/pre.json');
    if (!fs.existsSync(preJsonPath)) return { mode: 'exit', tag: undefined };
    const preJson = JSON.parse(fs.readFileSync(preJsonPath, 'utf-8')) as Record<string, unknown>;
    const mode = typeof preJson.mode === 'string' ? preJson.mode : 'exit';
    const tag = typeof preJson.tag === 'string' ? preJson.tag : undefined;
    return { mode, tag };
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
        // deno publish skips a version jsr already has. trying again is safer than dropping a release.
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

const pendingChangesets = hasPendingChangesets();
const needsPublish = !isVersionPublished(name, version);
const run = pendingChangesets || needsPublish;

// stops a release from going out on the wrong npm tag
const guardError = publishGuardError(branch, mode, tag, version, { pendingChangesets, needsPublish });
if (guardError) {
    console.error(`::error::${guardError} Refusing to publish.`);
    process.exit(1);
}

console.log(`pendingChangesets=${pendingChangesets} needsPublish=${needsPublish} (${name}@${version}) run=${run}`);
setOutput('run', String(run));

// pending changesets cannot gate jsr because pre mode keeps the .md files after versioning
const { name: jsrName, version: jsrVersion } = readDenoConfig();
const publishJsr = !isVersionOnJsr(jsrName, jsrVersion);
console.log(`jsr ${jsrName}@${jsrVersion} publish_jsr=${publishJsr}`);
setOutput('publish_jsr', String(publishJsr));
