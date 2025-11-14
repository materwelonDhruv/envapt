import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect } from 'chai';

import { getNezSecret } from '../src/nez-env';
import { EnvaptCache } from '../src/core/EnvapterBase';
import { Envapter } from '../src';

// Mock decoder that expects a pin and envDir passed via options
function mockDecoder(filePath: string, buf: Buffer): string {
  // file contains JSON like { "pin": "1452", "env": "test", "secret": "abc" }
  try {
    return JSON.parse(buf.toString('utf8')).secret;
  } catch {
    return buf.toString('utf8');
  }
}

describe('Nezlephant advanced', () => {
  const secretsDir = path.resolve(process.cwd(), 'tests', 'secrets');
  const file = path.join(secretsDir, 'super.json');
  let originalEnvPaths: string[] | undefined;

  beforeAll(() => {
    if (!fs.existsSync(secretsDir)) fs.mkdirSync(secretsDir, { recursive: true });
  });

  beforeEach(() => {
    // prevent dotenv from injecting test .env files
    originalEnvPaths = (Envapter as any)._envPaths ? (Envapter as any)._envPaths.slice() : undefined;
    (Envapter as any)._envPaths = [];

    EnvaptCache.clear();
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {}
    // ensure no leftover env from previous tests
    delete process.env.MY_SECRET;
  });

  afterEach(() => {
    // restore env paths
    if (originalEnvPaths) (Envapter as any)._envPaths = originalEnvPaths;
    else delete (Envapter as any)._envPaths;
  });

  afterAll(() => {
    try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch {}
  });

  it('should use mock decoder to read secret from JSON file', () => {
    const payload = JSON.stringify({ pin: '1452', env: 'test', secret: 'super' });
    fs.writeFileSync(file, payload, 'utf8');

    process.env.MY_SECRET = `nez:./tests/secrets/super.json`;
    EnvaptCache.clear();

    const val = getNezSecret('MY_SECRET', undefined, { decoder: (p, b) => mockDecoder(p, b) });
    expect(val).to.equal('super');
  });

  it('should fallback to plain env value when not a nez pointer', () => {
    process.env.MY_SECRET = 'plain-value';
    EnvaptCache.clear();

    const val = getNezSecret('MY_SECRET');
    expect(val).to.equal('plain-value');
  });
});
