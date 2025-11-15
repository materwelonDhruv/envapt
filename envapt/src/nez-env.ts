import { Envapter } from './Envapter';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EnvapterBase } from './core/EnvapterBase';

// Try to import the real nezlephant decoder if available in the workspace
let _decodeNezlephantBuffer: ((buf: Buffer) => string | Buffer) | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@funeste38/nezlephant');
  if (mod && typeof mod.decodeNezlephantBuffer === 'function') _decodeNezlephantBuffer = mod.decodeNezlephantBuffer;
} catch {
  /* ignore - decoder not installed */
}

export interface NezSecretDecoder {
  /**
   * @param filePath Absolute file path (after resolution)
   * @param buffer   File contents (e.g., Nezlephant PNG image)
   * @returns        The decoded secret as a string (token)
   */
  (filePath: string, buffer: Buffer): string;
}

export interface NezOptions {
  /**
   * Prefix used in .env to mark a Nezlephant secret, e.g. `DISCORD_TOKEN=nez:./secrets/discord.png`.
   * Default: "nez:"
   */
  marker?: string;

  /**
   * Base directory for resolving relative paths. Default: process.cwd()
   */
  baseDir?: string;

  /**
   * Decoder function used to extract the secret from the file.
   */
  decoder?: NezSecretDecoder;

  /**
   * Optional resolver hook for `nez:id:<id>` tokens. Should return an absolute or relative file path or null.
   */
  resolveId?: (id: string) => string | null;
}

/**
 * Default decoder: if '@funeste38/nezlephant' is present use it, otherwise fall back to utf8 string.
 */
const defaultDecoder: NezSecretDecoder = (_filePath, buf) => {
  if (_decodeNezlephantBuffer) {
    const out = _decodeNezlephantBuffer(buf);
    return typeof out === 'string' ? out : out.toString('utf8');
  }
  return buf.toString('utf8').trim();
};

function tryPaths(candidates: string[]): string | undefined {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  return undefined;
}

function walkUpFind(base: string, relativeParts: string[], maxLevels = 5): string | undefined {
  let dir = base;
  for (let i = 0; i < maxLevels; i++) {
    const candidate = path.join(dir, ...relativeParts);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

function resolveAndDecode(filePath: string, opts?: NezOptions): string {
  const baseDir = opts?.baseDir ?? process.cwd();

  // Normalize incoming path (remove leading ./ or /)
  let normalized = filePath;
  if (normalized.startsWith('./')) normalized = normalized.slice(2);
  else if (normalized.startsWith('/')) normalized = normalized.slice(1);

  const basename = path.basename(normalized);

  const candidates: string[] = [];
  // direct resolves
  candidates.push(path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath));
  candidates.push(path.resolve(process.cwd(), filePath));

  // with common extensions
  if (!path.extname(normalized)) {
    candidates.push(path.resolve(baseDir, `${normalized}.nez`));
    candidates.push(path.resolve(baseDir, `${normalized}.png`));
    candidates.push(path.resolve(process.cwd(), `${normalized}.nez`));
  } else {
    const noExt = normalized.replace(path.extname(normalized), '');
    candidates.push(path.resolve(baseDir, `${noExt}.nez`));
  }

  // common secret dirs relative to base and cwd
  candidates.push(path.resolve(baseDir, 'secrets', normalized));
  candidates.push(path.resolve(baseDir, 'tests', 'secrets', normalized));
  candidates.push(path.resolve(process.cwd(), 'envapt', 'tests', 'secrets', basename));
  candidates.push(path.resolve(process.cwd(), 'tests', 'secrets', normalized));

  // walk up to find tests/secrets or secrets folder
  const found1 = walkUpFind(baseDir, ['tests', 'secrets', basename]);
  if (found1) candidates.unshift(found1);
  const found2 = walkUpFind(baseDir, ['secrets', basename]);
  if (found2) candidates.unshift(found2);

  const resolved = tryPaths(candidates);
  if (!resolved) {
    // nothing found — throw a clear error
    throw new Error(`NezEnv: secret file not found (tried): ${candidates.join(', ')}`);
  }

  const buf = fs.readFileSync(resolved);
  const decoder = opts?.decoder ?? defaultDecoder;
  const raw = decoder(resolved, buf);
  return raw;
}

function isNezPointer(val: unknown, marker = 'nez:') {
  return typeof val === 'string' && val.startsWith(marker);
}

function makeNezConverter(opts?: NezOptions) {
  const marker = opts?.marker ?? 'nez:';

  return (raw: string | undefined, fallback?: string): string => {
    if (!raw || raw === '') {
      if (fallback !== undefined) return fallback;
      return '';
    }

    if (!raw.startsWith(marker)) {
      return raw;
    }

    const relPath = raw.slice(marker.length).trim();

    // support id: prefix using resolveId
    if (relPath.startsWith('id:')) {
      const id = relPath.slice('id:'.length);
      if (opts?.resolveId) {
        const resolved = opts.resolveId(id);
        if (!resolved) {
          if (fallback !== undefined) return fallback;
          return raw;
        }
        try {
          return resolveAndDecode(resolved, opts);
        } catch {
          if (fallback !== undefined) return fallback;
          return raw;
        }
      }
      // no resolver provided, fallback
      if (fallback !== undefined) return fallback;
      return raw;
    }

    try {
      const decoded = resolveAndDecode(relPath, opts);
      return decoded;
    } catch (err) {
      // If file not found or decode fails, gracefully fallback to provided fallback or return raw
      if (fallback !== undefined) return fallback;
      return raw;
    }
  };
}

/**
 * Main helper: retrieves a secret (string) via Envapt + Nezlephant.
 */
export function getNezSecret(key: string | string[], fallback?: string, options?: NezOptions): string {
  const converter = makeNezConverter(options);

  if (Array.isArray(key)) {
    for (const k of key) {
      const candidate = EnvapterBase.config.get(k) as string | undefined;
      if (candidate !== undefined && candidate !== null && candidate !== '') {
        if (isNezPointer(candidate, options?.marker ?? 'nez:')) {
          const rel = (candidate as string).slice((options?.marker ?? 'nez:').length).trim();

          // support id: tokens in array mode
          if (rel.startsWith('id:')) {
            const id = rel.slice('id:'.length);
            if (options?.resolveId) {
              const resolved = options.resolveId(id);
              if (!resolved) continue;
              try {
                return resolveAndDecode(resolved, options);
              } catch {
                continue;
              }
            }
            // no resolver -> skip
            continue;
          }

          try {
            return resolveAndDecode(rel, options);
          } catch {
            // if decoding fails, continue to next key
            continue;
          }
        }
        return candidate as string;
      }
    }
    return fallback ?? '';
  }

  // Single key: quick path - if a plain value exists in the environment cache, return it
  const rawFromCache = EnvapterBase.config.get(key as string) as string | undefined;
  if (rawFromCache !== undefined && !isNezPointer(rawFromCache, options?.marker ?? 'nez:')) {
    return rawFromCache as string;
  }

  return Envapter.getWith(key as any, converter as any, fallback as any) as string;
}
