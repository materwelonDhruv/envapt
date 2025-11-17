import { existsSync } from 'node:fs';
import path from 'node:path';

const findNearestPrettierConfig = (filePath) => {
    let dir = path.dirname(filePath);
    while (true) {
        const candidate = path.join(dir, 'prettier.config.mjs');
        if (existsSync(candidate)) {
            return { configPath: candidate, rootDir: dir };
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
};

const quoteFiles = (files) => files.map((file) => JSON.stringify(file)).join(' ');

const runPrettier = (files) => {
    if (!files.length) return [];

    const groups = new Map();

    for (const file of files) {
        const hit = findNearestPrettierConfig(file);
        const key = hit?.configPath ?? 'DEFAULT';
        if (!groups.has(key)) groups.set(key, { files: [], ...hit });
        groups.get(key).files.push(file);
    }

    const commands = [];

    for (const [, info] of groups) {
        const fileList = quoteFiles(info.files);
        if (!fileList) continue;

        const base = ['prettier', '--ignore-unknown', '--write'];
        if (info?.configPath) {
            base.push('--config', JSON.stringify(info.configPath));
        }

        const prettierCommand = [...base, fileList].join(' ');
        if (info?.rootDir) {
            const inner = `cd ${JSON.stringify(info.rootDir)} && pnpm exec ${prettierCommand}`;
            commands.push(`sh -c ${JSON.stringify(inner)}`);
        } else {
            commands.push(`pnpm exec ${prettierCommand}`);
        }
    }

    return commands;
};

const findNearestEslintConfig = (filePath) => {
    let currentDir = path.dirname(filePath);

    // traverse up the directory tree to find the nearest eslint.config.mjs
    while (true) {
        const candidate = path.join(currentDir, 'eslint.config.mjs');
        if (existsSync(candidate)) return candidate;

        const parent = path.dirname(currentDir);
        if (parent === currentDir) break;
        currentDir = parent;
    }

    return null;
};

const runEslint = (files) => {
    const filteredFiles = files.filter((file) => {
        // skip any .d.ts files
        if (file.endsWith('.d.ts')) return false;
        if (file.endsWith('next-env.d.ts')) return false;
        return true;
    });

    const byConfig = new Map();

    for (const file of filteredFiles) {
        const configPath = findNearestEslintConfig(file);
        const key = configPath ?? 'DEFAULT';

        if (!byConfig.has(key)) byConfig.set(key, []);
        byConfig.get(key).push(file);
    }

    const commands = [];

    for (const [configPath, groupedFiles] of byConfig.entries()) {
        const fileList = quoteFiles(groupedFiles);
        if (!fileList) continue;

        const configFlag = configPath === 'DEFAULT' ? '' : `--config ${JSON.stringify(configPath)}`;
        const command = ['eslint --max-warnings=0 --fix --cache', configFlag, fileList].filter(Boolean).join(' ');
        commands.push(command);
    }

    return commands;
};

/**
 * @type {import('lint-staged').Configuration}
 */
const config = {
    '*': runPrettier,
    '*.{ts,tsx,js,jsx,cjs,mjs}': runEslint
};

export default config;
