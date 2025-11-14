import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect } from 'chai';

import { getNezSecret } from '../src/nez-env';
import { EnvaptCache } from '../src/core/EnvapterBase';
import { Envapter } from '../src';

describe('Nezlephant helper', () => {
  const secretsDir = path.resolve(process.cwd(), 'tests', 'secrets');
  const discordFile = path.join(secretsDir, 'discord-token.txt');
  const altFile = path.join(secretsDir, 'alt-token.txt');
  let originalEnvPaths: string[] | undefined;

  beforeAll(() => {
    if (!fs.existsSync(secretsDir)) fs.mkdirSync(secretsDir, { recursive: true });
  });

  beforeEach(() => {
    // Backup and clear env paths so dotenv won't inject test .env files
    // Use internal field to avoid validation in the setter
    originalEnvPaths = (Envapter as any)._envPaths ? (Envapter as any)._envPaths.slice() : undefined;
    (Envapter as any)._envPaths = [];

    // ensure no leftover env vars from other tests
    delete process.env.DISCORD_TOKEN;
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.BOT_TOKEN;
    EnvaptCache.clear();

    // remove any leftover secret files to avoid collisions
    try {
      if (fs.existsSync(discordFile)) fs.unlinkSync(discordFile);
      if (fs.existsSync(altFile)) fs.unlinkSync(altFile);
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    // restore env paths (internal field)
    if (originalEnvPaths) (Envapter as any)._envPaths = originalEnvPaths;
    else delete (Envapter as any)._envPaths;
  });

  afterAll(() => {
    try {
      // cleanup files created by tests
      if (fs.existsSync(discordFile)) fs.unlinkSync(discordFile);
      if (fs.existsSync(altFile)) fs.unlinkSync(altFile);
    } catch {
      // ignore
    }
  });

  it('should decode nez: pointer to file via provided decoder', () => {
    const relPath = './tests/secrets/discord-token.txt';
    const tokenValue = 'super-secret-token';
    fs.writeFileSync(path.resolve(process.cwd(), relPath), tokenValue, 'utf8');

    process.env.DISCORD_TOKEN = `nez:${relPath}`;
    // Clear cache so Envapter picks up the updated process.env
    EnvaptCache.clear();

    const token = getNezSecret('DISCORD_TOKEN', undefined, {
      decoder: (_file, buf) => buf.toString('utf8')
    });

    expect(token).to.equal(tokenValue);
  });

  it('should support multiple keys and choose the first defined', () => {
    const altRel = './tests/secrets/alt-token.txt';
    const altValue = 'alt-token';
    fs.writeFileSync(path.resolve(process.cwd(), altRel), altValue, 'utf8');

    // Ensure primary is empty and secondary is set
    process.env.DISCORD_TOKEN = '';
    process.env.DISCORD_BOT_TOKEN = `nez:${altRel}`;
    EnvaptCache.clear();

    const token = getNezSecret(['DISCORD_TOKEN', 'DISCORD_BOT_TOKEN', 'BOT_TOKEN'], undefined, {
      decoder: (_file, buf) => buf.toString('utf8')
    });

    expect(token).to.equal(altValue);
  });
});
