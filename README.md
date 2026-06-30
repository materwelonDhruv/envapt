<img src="https://raw.githubusercontent.com/materwelonDhruv/envapt/main/.github/assets/logo.png" width="120" align="left" alt="envapt logo" />

<h3>envapt</h3>

<p>
  <strong>The apt way to read typed config.</strong><br/>
  Read config from any source as real typed values, with zero runtime dependencies.
</p>

<p>
  <a href="https://www.npmjs.com/package/envapt"><img alt="npm" src="https://img.shields.io/npm/v/envapt?logo=npm&logoColor=cb3838&label=%20&labelColor=103544&color=cb3838"></a>
  <a href="https://www.npmjs.com/package/envapt"><img alt="downloads" src="https://img.shields.io/npm/dm/envapt?style=flat&color=f7f6e8&labelColor=103544&label=downloads"></a>
  <a href="https://jsr.io/@materwelon/envapt"><img alt="jsr" src="https://jsr.io/badges/@materwelon/envapt"></a>
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/materwelonDhruv/envapt/checks.yml?branch=main&label=tests&style=flat&logo=github&color=3fb950&labelColor=103544">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/npm/l/envapt?style=flat&color=e97826&logo=apache&label="></a>
</p>

<br clear="left"/>

envapt returns config as the type you asked for instead of the `string | undefined` you get raw, with
a fallback that removes `undefined` from the return type. It reads from whatever source you bind. On
Node, Bun, and Deno that is `process.env` and your `.env` files, bound on import. On Cloudflare
Workers, in the browser, or for a secrets object you fetched at boot, you bind the source with
`Envapter.useSource(...)`.

```ts
import { Envapter } from 'envapt';

const port = Envapter.getNumber('PORT', 3000); // number, not string | undefined
```

**[Read the docs →](https://envapt.materwelon.dev)**

## What you get

- **Typed values.** A fallback removes `undefined` from the return type. Built-in converters cover
  numbers, booleans, bigint, JSON, URLs, regular expressions, dates, durations, and arrays, or pass
  your own function or a Standard Schema validator (zod, valibot, arktype).
- **Any source.** A source is any object with a `readVars()` method, so you can bind `process.env`, a
  Cloudflare Workers binding, a browser bundle, or a secrets payload you fetched from a store at boot.
  On Node, Bun, and Deno one binds on import.
- **Zero runtime dependencies.** The reader, converters, and built-in `.env` parser are self-contained,
  so nothing is added to your dependency tree.
- **Runs on Node, Bun, Deno, Cloudflare Workers, and the browser.** Node `>=20`, Bun `>=1.3`, Deno
  `>=2.5` (ESM and CJS). The portable build resolves through the package `exports`
  conditions.
- **`.env` loading built in on Node.** The default Node source adds a per-environment file cascade,
  `${VAR}` templates, and strict / required checks. Off Node there is no filesystem, so you bind
  another source with `Envapter.useSource(...)` and read with the same typed API.

## Install

```sh
npm install envapt
pnpm add envapt
yarn add envapt
bun add envapt
deno add jsr:@materwelon/envapt
```

## Quick start

Read values functionally with `Envapter`, or bind them to class fields with the `@Envapt` decorator.
Both share the same parsing, converters, and cache.

### Functional

Read a value from any call site, in JavaScript or TypeScript. No build step. On Node the source is
bound for you. On Workers and in the browser, call `Envapter.useSource(...)` first.

```ts
import { Envapter, Converters } from 'envapt';

const port = Envapter.getNumber('PORT', 3000);
const origins = Envapter.getUsing('ALLOWED_ORIGINS', Converters.array(), []);
```

On Cloudflare Workers, `env` is importable at module scope, so bind it once in a config module; in the
browser, seed a `ManualEnvSource` from the object your bundler injects.

```ts
import { env } from 'cloudflare:workers';
import { Envapter, WorkerEnvSource } from 'envapt';

Envapter.useSource(new WorkerEnvSource(env));

export const apiToken = Envapter.get('API_TOKEN');
```

### Decorator

Bind a value to a class field with a TC39 accessor decorator. No `experimentalDecorators` flag, and it runs on Bun and Deno from `.ts` directly.

```ts
import { EnvNum } from 'envapt';

class Config {
    @EnvNum('PORT', 3000)
    static accessor port: number;
}
```

The legacy (experimentalDecorators) decorators are exported from `envapt/legacy`.

## Agent skill

Install the envapt agent skill so AI coding tools use the correct API:

```sh
npx skills add materwelonDhruv/envapt
```

---

<p align="center"><sub>Built by <a href="https://github.com/materwelondhruv">@materwelonDhruv</a> · Apache 2.0</sub></p>
