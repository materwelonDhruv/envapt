import type { BundledLanguage } from 'shiki';

export interface OgSnippet {
    filename: string;
    lang: BundledLanguage;
    code: string;
}

// Per docs-page OG snippet, keyed by the page slug ('index' for /docs).
export const OG_SNIPPETS: Record<string, OgSnippet | undefined> = {
    index: {
        filename: 'config.ts',
        lang: 'ts',
        code: `// envapt - typed config, zero deps
import { Envapter, Converters } from 'envapt';

const url = Envapter.getUsing(
  'UPSTREAM_URL', Converters.Url
);
// a URL, not string | undefined`
    },
    'quick-start': {
        filename: 'app.ts',
        lang: 'ts',
        code: `// Quick Start - your first typed value
import { Envapter } from 'envapt';

const port = Envapter.getNumber('PORT', 3000);
// number, never string | undefined`
    },
    envapter: {
        filename: 'db.ts',
        lang: 'ts',
        code: `// Envapter - typed reads, ordered fallback
const db = Envapter.get(
  ['READONLY_URL', 'DATABASE_URL'],
  'sqlite://memory'
);`
    },
    environment: {
        filename: 'env.ts',
        lang: 'ts',
        code: `// Environment - switch mode and branch on it
Envapter.environment = 'production';
const level = Envapter.isProduction
  ? 'warn'
  : 'debug';`
    },
    decorators: {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Decorators - bind env vars to typed fields
class Config {
  @EnvUrl('DATABASE_URL')
  static accessor db: URL;

  @EnvTime('CACHE_TTL', '15m')
  static accessor cacheTtl: number;
}`
    },
    converters: {
        filename: 'cache.ts',
        lang: 'ts',
        code: `// Converters - read a duration as milliseconds
// CACHE_TTL=15m in your config
const ttl = Envapter.getUsing(
  'CACHE_TTL', Converters.Time
); // 900000 (ms)`
    },
    templates: {
        filename: '.env',
        lang: 'dotenv',
        code: `# Templates - reference one var from another
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgres://\${DB_HOST}:\${DB_PORT}/app`
    },
    'standard-schema': {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Standard Schema - validate PORT with zod
import { z } from 'zod';

const port = Envapter.parse(
  'PORT',
  z.coerce.number().int().min(1024)
);`
    },
    'strict-mode': {
        filename: 'bootstrap.ts',
        lang: 'ts',
        code: `// Strict Mode - whitespace becomes missing
Envapter.strict = true;
Envapter.require('DATABASE_URL', 'API_KEY');`
    },
    errors: {
        filename: 'bootstrap.ts',
        lang: 'ts',
        code: `// Errors - branch on the typed error code
try {
  Envapter.require('DATABASE_URL');
} catch (e) {
  if (e instanceof EnvaptError) e.code;
}`
    },
    configuration: {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Configuration - pick which files load
Envapter.envPaths = ['.env.local', '.env'];
Envapter.envFileOptions = { override: true };
Envapter.debug = 'verbose';`
    },
    'env-file-syntax': {
        filename: '.env',
        lang: 'dotenv',
        code: `# .env File Syntax - quoting and comments
HOST=localhost # inline comment, stripped
COLOR=#ff0000 # kept: no space before the #
TLS_KEY="line one\\nline two"`
    },
    'migration-v4-to-v5': {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Migration - array converters now use array()
// v4
@Envapt('PORTS', { converter:
  { delimiter: ',', type: Converters.Number } })
// v5
@Envapt('PORTS', { converter:
  Converters.array({ of: Converters.Number }) })`
    },
    'migration-v5-to-v6': {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Migration - positional form removed in v6
// v5
@Envapt('PORT', 8080, Number)
// v6
@EnvNum('PORT', 8080)`
    },
    'migration-v6-to-v7': {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Migration - decorators are TC39 accessors in v7
// v6 - still exported via 'envapt/legacy'
@Envapt('PORT', { fallback: 3000 })
static readonly port: number;
// v7 - now exported via 'envapt'
@Envapt('PORT', { fallback: 3000 })
static accessor port: number;`
    },
    compatibility: {
        filename: 'tsconfig.json',
        lang: 'jsonc',
        code: `// Compatibility - legacy decorators need this flag
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}`
    },
    sources: {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Sources - any readVars() object is a source
const source = { readVars: () => secrets };
Envapter.useSource(source);
const db = Envapter.getUsing(
  'DATABASE_URL', Converters.Url
);`
    },
    'secret-stores': {
        filename: 'boot.ts',
        lang: 'ts',
        code: `// Secret stores - fetch, bind, read typed
const secrets = await fetchFromStore();
Envapter.useSource({ readVars: () => secrets });
const db = Envapter.getUsing(
  'DATABASE_URL', Converters.Url
);`
    },
    workers: {
        filename: 'worker.ts',
        lang: 'ts',
        code: `// Workers - bind the env binding at module load
import { env } from 'cloudflare:workers';

Envapter.useSource(new WorkerEnvSource(env));
const origin = Envapter.getUsing(
  'ORIGIN_URL', Converters.Url
);`
    },
    browser: {
        filename: 'client.ts',
        lang: 'ts',
        code: `// Browser - seed your bundler's injected config
Envapter.useSource(
  new ManualEnvSource(import.meta.env)
);
const api = Envapter.getUsing(
  'VITE_API_URL', Converters.Url
);`
    }
};
