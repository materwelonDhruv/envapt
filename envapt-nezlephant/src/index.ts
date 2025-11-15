import { Envapter } from 'envapt';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { decodeNezlephantBuffer } from '@funeste38/nezlephant';

export interface NezSecretDecoder {
  (filePath: string, buffer: Buffer): string;
}

export type IdResolver = (id: string) => string | null;

export interface NezOptions {
  marker?: string;
  baseDir?: string;
  decoder?: NezSecretDecoder;
  resolveId?: IdResolver;
}

const defaultDecoder: NezSecretDecoder = (_filePath, buffer) => {
  const out = decodeNezlephantBuffer(buffer);
  return typeof out === 'string' ? out : out.toString('utf8');
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

    const ref = raw.slice(marker.length).trim();

    // support id: prefix using resolveId
    if (ref.startsWith('id:')) {
      const id = ref.slice('id:'.length);
      if (opts?.resolveId) {
        const resolved = opts.resolveId(id);
        if (!resolved) throw new Error(`Unknown Nez id: ${id}`);
        return resolveAndDecode(resolved, opts);
      }
      throw new Error(`Nez id reference but no resolveId provided: ${id}`);
    }

    // mode simple : ref = chemin
    const decoded = resolveAndDecode(ref, opts);
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
