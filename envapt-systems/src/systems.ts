import * as fs from 'node:fs';
import * as path from 'node:path';

export type SystemDecoderResult = unknown;

export type SystemDecoderContext = {
  key: string;
  raw: string;
};

export type SystemDecoder = (value: string, ctx: SystemDecoderContext) => SystemDecoderResult;

const systems = new Map<string, SystemDecoder>();

export function registerSystem(prefix: string, decoder: SystemDecoder) {
  systems.set(prefix, decoder);
}

export function decodeSystemValue(key: string, raw: string | undefined): SystemDecoderResult {
  if (raw === undefined || raw === null) return raw;
  const colon = raw.indexOf(':');
  if (colon < 0) return raw;

  const prefix = raw.slice(0, colon);
  const rest = raw.slice(colon + 1);

  const decoder = systems.get(prefix);
  if (!decoder) return raw;

  return decoder(rest, { key, raw });
}

// Builtins
registerSystem('json', (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
});

registerSystem('b64', (value) => {
  return Buffer.from(value, 'base64').toString('utf8');
});

registerSystem('file', (value) => {
  const full = path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
  return fs.readFileSync(full, 'utf8');
});

// placeholder nez decoder to be wired externally
registerSystem('nez', (value, ctx) => {
  // default behavior: return raw pointer so callers can delegate to envapt-nezlephant
  return `nez:${value}`;
});

export default { registerSystem, decodeSystemValue };
