import fs from 'node:fs';
import { resolve } from 'node:path';

const packagePath = resolve(import.meta.dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8')) as Record<string, unknown>;

if (!packageJson.version) throw new Error('Version not found in package.json');

const jsrConfigPath = resolve(import.meta.dirname, '../jsr.json');
const jsrJson = JSON.parse(fs.readFileSync(jsrConfigPath, 'utf-8')) as Record<string, unknown>;

const jsrConfig = {
  ...jsrJson,
  version: packageJson.version
};

fs.writeFileSync(jsrConfigPath, `${JSON.stringify(jsrConfig, null, 2)}\n`, 'utf-8');
// eslint-disable-next-line no-console
console.log(
  `JSR publish version updated from ${jsrJson.version as string} to ${packageJson.version as string} in jsr.json`
);
