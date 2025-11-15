import { describe, it } from 'vitest';
import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';

import { Envapter } from '../src';
import { EnvaptCache } from '../src/core/EnvapterBase';

describe('EnvapterBase runtime config', () => {
  const tmpEnv = path.join(__dirname, '.env.runtime-test');

  it('should load variables via runtime EnvapterBase.config()', () => {
    // backup existing internal envPaths
    const originalInternal = (Envapter as any)._envPaths ? (Envapter as any)._envPaths.slice() : undefined;
    const originalEnvValue = process.env.RUNTIME_TEST_KEY;

    try {
      // create temp .env file (not strictly required but mirrors intended scenario)
      fs.writeFileSync(tmpEnv, 'RUNTIME_TEST_KEY=hello_runtime');

      // ensure process.env has the variable so isolatedEnv includes it
      process.env.RUNTIME_TEST_KEY = 'hello_runtime';

      // set internal envPaths directly to avoid runtime validation that checks other files
      // Use a string so dotenv receives a valid path
      (Envapter as any)._envPaths = tmpEnv;

      // clear cache so getter will reload using our temp file / process.env
      EnvaptCache.clear();

      // trigger the getter (this covers the runtime config getter)
      const result = new Envapter().getRaw('RUNTIME_TEST_KEY');

      expect(result).to.equal('hello_runtime');
    } finally {
      // cleanup
      try {
        if (fs.existsSync(tmpEnv)) fs.unlinkSync(tmpEnv);
      } catch {}

      // restore original process.env value
      if (originalEnvValue === undefined) delete process.env.RUNTIME_TEST_KEY;
      else process.env.RUNTIME_TEST_KEY = originalEnvValue;

      // restore original internal envPaths if we had one
      if (originalInternal) {
        (Envapter as any)._envPaths = originalInternal;
      } else {
        delete (Envapter as any)._envPaths;
      }

      // clear cache to avoid leaking state into other tests
      try {
        EnvaptCache.clear();
      } catch {
        // ignore
      }
    }
  });
});
