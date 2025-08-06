import console from "node:console";
import fs from 'node:fs';
import { resolve } from 'node:path';

const importMeta = import.meta as { dirname: string }
console.log(importMeta.dirname)

const packagePath = resolve(importMeta.dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8')) as Record<string, unknown>;

if (!packageJson.version) throw new Error('Version not found in package.json');

const denoConfigPath = resolve(importMeta.dirname, '../deno.json');
const denoJson = JSON.parse(fs.readFileSync(denoConfigPath, 'utf-8')) as Record<string, unknown>;

const denoConfig = {
  ...denoJson,
  version: packageJson.version
};

fs.writeFileSync(denoConfigPath, `${JSON.stringify(denoConfig, null, 2)}\n`, 'utf-8');
// eslint-disable-next-line no-console
console.log(
  `JSR publish version updated from ${denoJson.version as string} to ${packageJson.version as string} in deno.json`
);
