import console from 'node:console';
import fs from 'node:fs';
import { resolve } from 'node:path';

const packagePath = resolve(import.meta.dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8')) as Record<string, unknown>;

if (!packageJson.version) throw new Error('Version not found in package.json');

const denoConfigPath = resolve(import.meta.dirname, '../deno.json');
const denoJson = JSON.parse(fs.readFileSync(denoConfigPath, 'utf-8')) as Record<string, unknown>;

const denoConfig = {
    ...denoJson,
    version: packageJson.version
};

fs.writeFileSync(denoConfigPath, `${JSON.stringify(denoConfig, null, 2)}\n`, 'utf-8');

console.log(
    `JSR publish version updated from ${denoJson.version as string} to ${packageJson.version as string} in deno.json`
);
