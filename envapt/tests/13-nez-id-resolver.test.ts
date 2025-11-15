import { expect } from 'chai';
import { describe, it, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { getNezSecret } from '../src/nez-env';
import { EnvaptCache } from '../src/core/EnvapterBase';

describe('nez:id resolver option', () => {
  const tmpFile = path.resolve(process.cwd(), 'tests', 'secrets', 'nez-id-test.txt');

  beforeEach(() => {
    // ensure clean env
    delete process.env.TEST_NEZ_ID;
    EnvaptCache.clear();
    try {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    } catch {}
  });

  it('should use resolveId to map id to file path', () => {
    const id = 'test';
    const content = 'secret-by-id';
    // create the target file
    const targetDir = path.dirname(tmpFile);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(tmpFile, content, 'utf8');

    process.env.TEST_NEZ_ID = `nez:id:${id}`;

    const out = getNezSecret('TEST_NEZ_ID', undefined, {
      resolveId: (given) => (given === id ? tmpFile : null),
      decoder: (_p, buf) => buf.toString('utf8')
    });

    expect(out).to.equal(content);
  });
});
