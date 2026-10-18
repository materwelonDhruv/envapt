import type { BundledLanguage } from 'shiki';

export interface OgSnippet {
    filename: string;
    lang: BundledLanguage;
    code: string;
}

// keyed by docs page slug, with 'index' for /docs
const OG_SNIPPETS: Record<string, OgSnippet | undefined> = {
    index: {
        filename: 'config.ts',
        lang: 'ts',
        code: `// envapt - typed config, zero deps
import { Envapter, Converters } from 'envapt';

const url = Envapter.getRequired(
  'UPSTREAM_URL', Converters.Url
);
// typed as URL`
    },
    'quick-start': {
        filename: 'app.ts',
        lang: 'ts',
        code: `// Quick Start - your first typed value
import { Envapter, Converters } from 'envapt';

const port = Envapter.getAs(
  'PORT', Converters.Port, 3000
);
// typed as number`
    },
    envapter: {
        filename: 'db.ts',
        lang: 'ts',
        code: `// Reading values - typed reads, ordered keys
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
const ttl = Envapter.getAs(
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

const port = Envapter.getAs(
  'PORT',
  z.coerce.number().int().min(1024)
);`
    },
    'required-values': {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Required values - fail at boot, every bad key at once
export const config = Envapter.getRequiredAll({
  DATABASE_URL: Converters.Url,
  PORT: Converters.Port
});`
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
    'env-files': {
        filename: '.env.production',
        lang: 'dotenv',
        code: `# .env files on Node - picked by environment
# this file overrides .env.local and .env
DATABASE_URL=postgres://prod-db:5432/app
CACHE_TTL=15m`
    },
    'env-file-syntax': {
        filename: '.env',
        lang: 'dotenv',
        code: `# .env file syntax - quoting and comments
HOST=localhost # inline comment, stripped
COLOR="#ff0000" # quote a value that starts with #
TLS_KEY="line one\\nline two"`
    },
    testing: {
        filename: 'config.test.ts',
        lang: 'ts',
        code: `// Testing - give each test its own config
beforeEach(() => {
  Envapter.useSource(new PortableSource({ PORT: '4000' }));
});
afterEach(() => Envapter.useSource(new FileSource()));`
    },
    migrations: {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Migrations - one major version at a time
// v7 to v8: one universal 'envapt' import
// v8 to v9: getUsing, getWith, and parse become getAs
import { Envapter, PortableSource } from 'envapt';`
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
    'migration-v7-to-v8': {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Migration - one universal import in v8
// v7
import { WorkerEnvSource } from 'envapt/workerd';
// v8
import { PortableSource } from 'envapt';`
    },
    'migration-v8-to-v9': {
        filename: 'config.ts',
        lang: 'ts',
        code: `// Migration - one reader for every converter in v9
// v8
Envapter.parse('PORT', z.coerce.number(), 3000);
// v9
Envapter.getAs('PORT', z.coerce.number(), 3000);`
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
const db = Envapter.getAs(
  'DATABASE_URL', Converters.Url
);`
    },
    'secret-stores': {
        filename: 'boot.ts',
        lang: 'ts',
        code: `// Secret stores - fetch, bind, read typed
const secrets = await fetchFromStore();
Envapter.useSource({ readVars: () => secrets });
const db = Envapter.getAs(
  'DATABASE_URL', Converters.Url
);`
    },
    workers: {
        filename: 'worker.ts',
        lang: 'ts',
        code: `// Workers - bind the env object at module load
import { env } from 'cloudflare:workers';

Envapter.useSource(new PortableSource(env));
const origin = Envapter.getAs(
  'ORIGIN_URL', Converters.Url
);`
    },
    browser: {
        filename: 'client.ts',
        lang: 'ts',
        code: `// Browser - bind your bundler's import.meta.env
Envapter.useSource(
  new PortableSource(import.meta.env)
);
const api = Envapter.getAs(
  'VITE_API_URL', Converters.Url
);`
    },
    'edge-runtimes': {
        filename: 'edge.ts',
        lang: 'ts',
        code: `// Edge runtimes - bind the platform's config object
Envapter.useSource(new PortableSource(platformEnv));
const url = Envapter.getRequired(
  'ORIGIN_URL', Converters.Url
);`
    }
};

export function snippetFor(slugs: readonly string[]): OgSnippet | undefined {
    return OG_SNIPPETS[slugs.join('/') || 'index'];
}
