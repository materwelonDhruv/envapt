<img src="https://raw.githubusercontent.com/materwelonDhruv/envapt/main/.github/assets/logo.png" width="120" align="left" alt="envapt logo" />

<h3>envapt</h3>

<p>
  <strong>The apt way to read typed config.</strong><br/>
  Typed, validated config from <code>process.env</code>, <code>.env</code> files, or any object, on Node, Bun, Deno, Cloudflare Workers, and the browser. No runtime dependencies.
</p>

<p>
  <a href="https://www.npmjs.com/package/envapt"><img alt="npm" src="https://img.shields.io/npm/v/envapt?logo=npm&logoColor=cb3838&label=%20&labelColor=103544&color=cb3838"></a>
  <a href="https://www.npmjs.com/package/envapt"><img alt="downloads" src="https://img.shields.io/npm/dm/envapt?style=flat&color=f7f6e8&labelColor=103544&label=downloads"></a>
  <a href="https://jsr.io/@materwelon/envapt"><img alt="jsr" src="https://jsr.io/badges/@materwelon/envapt"></a>
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/materwelonDhruv/envapt/checks.yml?branch=main&label=tests&style=flat&logo=github&color=3fb950&labelColor=103544">
  <a href="https://codecov.io/github/materwelonDhruv/envapt"><img alt="codecov" src="https://img.shields.io/codecov/c/github/materwelonDhruv/envapt/main?token=IQ4GC645LO&logo=codecov&color=f01f7a&labelColor=103544"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/npm/l/envapt?style=flat&color=e97826&logo=apache&label="></a>
</p>

<br clear="left"/>

`process.env.PORT` is a string, and `Number(process.env.PORT ?? 3000)` turns `PORT=80a` into `NaN` with no error. envapt reads each variable as the type you ask for and stops the app at startup when a required one is missing or malformed.

```ts
import { Converters, Envapter } from 'envapt';

const { port, databaseUrl, cacheTtl, allowedOrigins } = Envapter.getRequiredAll(
    {
        PORT: Converters.Port, // number, checked against 0-65535
        DATABASE_URL: Converters.Url, // URL
        CACHE_TTL: Converters.Time, // "15m" parsed to 900000
        ALLOWED_ORIGINS: Converters.array() // string[]
    },
    'camelCase'
);
```

If `PORT` and `DATABASE_URL` are unset, that call throws one error listing both:

```txt
EnvaptError [305]: Missing required environment variables: PORT, DATABASE_URL.
```

If every key is set but some values can't convert, the call throws one `InvalidEnvValue` listing every bad key. The message holds keys only, so catch the error and log `error.message` to keep secret values out of your logs.

**[Read the docs →](https://envapt.materwelon.dev)**

## Why envapt

- **Coming from dotenv.** envapt reads the same `.env` files, picks the ones for the current environment (`.env.production`, `.env.local`, and so on), and returns typed values. `import 'envapt/config'` also copies the keys into `process.env`, the same as `dotenv/config`.
- **A schema when you want one.** The built-in converters cover ports, URLs, durations, JSON, emails, and more, with no schema library installed. When a converter isn't enough, pass a zod, valibot, or arktype schema, or any synchronous Standard Schema.
- **One API on every runtime.** Node, Bun, and Deno read `process.env` and your `.env` files from the moment you import envapt. On Cloudflare Workers, edge runtimes, and the browser, you bind the object the platform gives you once, then read with the same calls.
- **Functions or decorators.** Read with `Envapter` from any call site, or declare typed class fields with a TC39 `@Envapt` accessor decorator.

envapt is ESM only and needs Node `>=22.23.3`, Bun `>=1.3.11`, or Deno `>=2.5`. A read with a fallback also returns the fallback when the value can't convert, so `PORT=80a` reads as `3000`. Use a required read for values that must be right.

## Install

```sh
npm install envapt
pnpm add envapt
yarn add envapt
bun add envapt
deno add jsr:@materwelon/envapt
```

`require('envapt')` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. In a CommonJS project, load it with `await import('envapt')`.

## Quick start

### Functional

On Node, Bun, and Deno, read from any call site with no setup:

```ts
import { Converters, Envapter } from 'envapt';
import { z } from 'zod';

const requestTimeout = Envapter.getAs('REQUEST_TIMEOUT', Converters.Time, '30s'); // 30000
const maxRetries = Envapter.getAs('MAX_RETRIES', Converters.Integer, 3);
const debug = Envapter.getBoolean('DEBUG', false);
const logLevel = Envapter.getRequired('LOG_LEVEL', z.enum(['debug', 'info', 'warn', 'error']));
```

On Cloudflare Workers, bind `env` once in a config module, before the first read:

```ts
import { env } from 'cloudflare:workers';
import { Converters, Envapter, PortableSource } from 'envapt';

Envapter.useSource(new PortableSource(env));

export const apiToken = Envapter.getRequired('API_TOKEN', Converters.String);
```

In the browser, bind the object your bundler injects, such as Vite's `import.meta.env`.

### Decorator

Declare config as class fields with a TC39 accessor decorator. TypeScript needs no extra compiler flag for it, and Bun and Deno run it from `.ts` directly.

```ts
import { Converters, Envapt, EnvTime } from 'envapt';

class Config {
    @Envapt('PORT', { converter: Converters.Port, fallback: 3000 })
    static accessor port: number;

    @EnvTime('CACHE_TTL', '15m')
    static accessor cacheTtl: number;
}
```

For `experimentalDecorators` projects, the legacy decorators are in `envapt/legacy`.

### Coming from dotenv

Swap `import 'dotenv/config'` for this line. Your `process.env.X` reads keep working while you move them over:

```ts
import 'envapt/config';
```

## Docs

- [Quick start](https://envapt.materwelon.dev/docs/quick-start)
- [Converters](https://envapt.materwelon.dev/docs/converters)
- [Required values and errors](https://envapt.materwelon.dev/docs/required-values)
- [Migrating from v8 to v9](https://envapt.materwelon.dev/docs/migration-v8-to-v9)
- [API reference](https://envapt.materwelon.dev/docs/api)

AI coding tools can use the right API with the envapt agent skill. Install it with `npx skills add materwelonDhruv/envapt`, or point your tool at the [published skill](https://envapt.materwelon.dev/.well-known/agent-skills/envapt/SKILL.md).

---

<p align="center"><sub>Built by <a href="https://github.com/materwelondhruv">@materwelonDhruv</a> · Apache 2.0</sub></p>
