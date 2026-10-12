import { existsSync } from 'node:fs';
import path from 'node:path';

interface ConfigHit {
    configPath: string;
    rootDir: string;
}

function findNearestConfig(filePath: string, name: string): ConfigHit | null {
    let dir = path.dirname(filePath);
    let checked: string;
    do {
        const candidate = path.join(dir, name);
        if (existsSync(candidate)) return { configPath: candidate, rootDir: dir };

        checked = dir;
        dir = path.dirname(dir);
    } while (dir !== checked);

    return null;
}

// lint-staged splits commands with string-argv
// it never unescapes \" or \\
function quote(arg: string): string {
    if (!arg.includes('"')) return `"${arg}"`;
    if (!arg.includes("'")) return `'${arg}'`;
    throw new Error(`lint-staged can't pass a path holding both ' and ", got ${arg}. Rename the file.`);
}

const quoteFiles = (files: readonly string[]): string => files.map(quote).join(' ');

interface Group extends Partial<ConfigHit> {
    files: string[];
}

function groupByConfig(files: readonly string[], name: string): Map<string, Group> {
    const groups = new Map<string, Group>();

    for (const file of files) {
        const hit = findNearestConfig(file, name);
        const key = hit?.configPath ?? 'DEFAULT';
        if (!groups.has(key)) groups.set(key, { files: [], ...hit });
        groups.get(key)?.files.push(file);
    }

    return groups;
}

// every command starts in the repo root, with no shell to run a cd
function scoped(rootDir: string | undefined, command: string): string {
    return rootDir === undefined ? `pnpm exec ${command}` : `pnpm -C ${quote(rootDir)} exec ${command}`;
}

export function runPrettier(files: readonly string[]): string[] {
    if (files.length === 0) return [];

    const commands: string[] = [];

    for (const info of groupByConfig(files, 'prettier.config.mjs').values()) {
        const fileList = quoteFiles(info.files);
        if (!fileList) continue;

        const base = ['prettier', '--ignore-unknown', '--write'];
        if (info.configPath) base.push('--config', quote(info.configPath));

        commands.push(scoped(info.rootDir, [...base, fileList].join(' ')));
    }

    return commands;
}

export function runEslint(files: readonly string[]): string[] {
    const linted = files.filter((file) => !file.endsWith('.d.ts'));
    const commands: string[] = [];

    for (const [configPath, info] of groupByConfig(linted, 'eslint.config.mjs')) {
        const { rootDir } = info;
        const scopedFiles = rootDir === undefined ? info.files : info.files.map((file) => path.relative(rootDir, file));
        const fileList = quoteFiles(scopedFiles);
        if (!fileList) continue;

        const scopedConfigPath =
            rootDir !== undefined && configPath !== 'DEFAULT' ? path.relative(rootDir, configPath) : configPath;
        const configFlag = scopedConfigPath === 'DEFAULT' ? '' : `--config ${quote(scopedConfigPath)}`;
        const command = ['eslint --no-warn-ignored --max-warnings=0 --fix --cache', configFlag, fileList]
            .filter(Boolean)
            .join(' ');

        commands.push(scoped(rootDir, command));
    }

    return commands;
}
