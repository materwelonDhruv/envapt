import { Envapter } from 'envapt';
import fs from 'node:fs';
import path from 'node:path';
import { decodeNezlephantBuffer } from '@funeste38/nezlephant';

export interface NezSecretDecoder {
  (filePath: string, buffer: Buffer): string;
}

export interface NezOptions {
  marker?: string;
  baseDir?: string;
  decoder?: NezSecretDecoder;
}

const defaultDecoder: NezSecretDecoder = (filePath, buffer) => {
  const out = decodeNezlephantBuffer(buffer);
  if (typeof out === 'string') return out;
  return out.toString('utf8');
};

function resolveAndDecode(filePath: string, opts?: NezOptions): string {
  const baseDir = opts?.baseDir ?? process.cwd();
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
  const buf = fs.readFileSync(absPath);

  const decoder = opts?.decoder ?? defaultDecoder;
  return decoder(absPath, buf);
}

function makeNezConverter(opts?: NezOptions) {
  const marker = opts?.marker ?? 'nez:';

  return (raw: string | undefined, fallback?: string): string => {
    if (!raw || raw === '') {
      if (fallback !== undefined) return fallback;
      return '';
    }

    if (!raw.startsWith(marker)) return raw;

    const relPath = raw.slice(marker.length).trim();
    const decoded = resolveAndDecode(relPath, opts);
    return decoded;
  };
}

export function getNezSecret(
  key: string | string[],
  fallback?: string,
  options?: NezOptions
): string {
  const converter = makeNezConverter(options);
  return Envapter.getWith(key as any, converter as any, fallback as any) as string;
}

export function createNezConverter(options?: NezOptions) {
  return makeNezConverter(options);
}
