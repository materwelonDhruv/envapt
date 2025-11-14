import * as fs from 'node:fs';
import * as path from 'node:path';
import { verifyOC8FromBuffer } from './verifyOC8.js';

export { verifyOC8FromBuffer };

export function encodeOc8(payload: Buffer): Buffer {
  try {
    // require the CJS helper
    const oc8 = (require as any)('./oc8.cjs');
    return oc8.encodeOc8ToPngBuffer(payload);
  } catch (e) {
    throw new Error('OC8 encoder requires pngjs to be available and oc8.cjs present');
  }
}

export function decodeOc8(buf: Buffer): Buffer {
  try {
    const oc8 = (require as any)('./oc8.cjs');
    return oc8.decodeOc8FromPngBuffer(buf);
  } catch (e) {
    throw new Error('OC8 decoder requires pngjs to be available and oc8.cjs present');
  }
}

// Avoid static import of 'envapt' to prevent module resolution issues in this package during development.
function getEnvapter(): any {
  // Prefer a real import if available at runtime
  try {
    // dynamic import; returns a promise when used, but here we try synchronous require via CommonJS if present
    // In ESM runtime, consumers will have envapt available via normal imports and will call register after imports.
    // For safety, check globalThis first (used in tests where envapt is loaded in the same process).
    if ((globalThis as any).Envapter) return (globalThis as any).Envapter;
  } catch {}
  return undefined;
}

export interface SuperImgOptions {
  marker?: string; // prefix in env, default 'superimg:'
  file?: string; // path to the image (absolute or relative to cwd)
  baseDir?: string; // base dir for resolving file
  /**
   * optional 4-digit PIN to unlock the super-image contents
   */
  pin?: string | number;
  /**
   * optional directory name used to select environment-specific blobs inside the image
   * e.g. 'production' | 'staging' | 'test'
   */
  envDir?: string;
  /**
   * decoder may accept either (buf) => string or (filePath, buf, pin, envDir) => string
   */
  decoder?: ((buf: Buffer) => string) | ((filePath: string, buf: Buffer, pin?: string, envDir?: string) => string);
}

let SUPER_ENV: Record<string, unknown> | null = null;

function defaultDecoder(buf: Buffer): string {
  // default stub decoder: assume the PNG contains plaintext JSON
  return buf.toString('utf8');
}

export function loadSuperEnv(filePath?: string, opts?: SuperImgOptions): Record<string, unknown> | null {
  const baseDir = opts?.baseDir ?? process.cwd();
  const file = filePath ?? opts?.file ?? path.join(baseDir, 'secrets', 'super-secrets.png');
  const abs = path.isAbsolute(file) ? file : path.resolve(baseDir, file);
  const buf = fs.readFileSync(abs);

  const decoder = opts?.decoder ?? defaultDecoder;
  // support both decoder signatures
  let decoded: string;
  try {
    if ((decoder as any).length >= 3) {
      // (filePath, buf, pin?, envDir?)
      decoded = (decoder as any)(abs, buf, opts?.pin ? String(opts.pin) : undefined, opts?.envDir);
    } else {
      decoded = (decoder as any)(buf);
    }
  } catch (e) {
    throw new Error(`SuperImg: decoder failed for ${abs}: ${(e as Error).message}`);
  }

  try {
    SUPER_ENV = JSON.parse(decoded);
  } catch (e) {
    throw new Error(`Failed to parse super image JSON from ${abs}: ${(e as Error).message}`);
  }

  return SUPER_ENV;
}

export function getSuper<T = unknown>(key: string, fallback?: T): T | undefined {
  if (!SUPER_ENV) return fallback;
  // support nested keys like 'smtp.host'
  const parts = key.split('.');
  let cur: any = SUPER_ENV;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return fallback;
  }
  return cur as T;
}

export function makeSuperTransformer(opts?: SuperImgOptions) {
  return (key: string, raw: string | undefined) => {
    if (raw !== undefined && raw !== '') return raw;
    if (!SUPER_ENV) {
      try {
        loadSuperEnv(undefined, opts);
      } catch {
        return undefined;
      }
    }
    return getSuper(key, undefined) as any;
  };
}

export function register(opts?: SuperImgOptions) {
  const transformer = makeSuperTransformer(opts);
  // try to register with Envapter if it's available at runtime
  const EnvapterRef = getEnvapter();
  if (EnvapterRef) {
    (EnvapterRef as any).valueTransformers = (EnvapterRef as any).valueTransformers || [];
    (EnvapterRef as any).valueTransformers.push(transformer);
  }
  // return transformer regardless so callers can use it manually
  return transformer;
}
