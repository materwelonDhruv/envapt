import { beforeAll, afterAll } from 'vitest';
import { EnvaptCache } from '../src/core/EnvapterBase';

const ORIGINAL_USERNAME = process.env.USERNAME;
const ORIGINAL_USER = process.env.USER;

function resetEnvaptCache() {
  EnvaptCache.clear();
}

beforeAll(() => {
  // remove potentially interfering system env vars for the test run
  delete process.env.USERNAME;
  delete process.env.USER;

  resetEnvaptCache();
});

afterAll(() => {
  if (ORIGINAL_USERNAME === undefined) delete process.env.USERNAME;
  else process.env.USERNAME = ORIGINAL_USERNAME;

  if (ORIGINAL_USER === undefined) delete process.env.USER;
  else process.env.USER = ORIGINAL_USER;

  resetEnvaptCache();
});
