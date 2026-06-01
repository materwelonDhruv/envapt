<table border="0" cellspacing="0" cellpadding="0">
<tr>
<td width="160" valign="middle" align="center">
  <img src="https://raw.githubusercontent.com/materwelonDhruv/envapt/main/.github/assets/logo.png" width="120" alt="envapt logo" />
</td>
<td valign="middle">
  <h1>envapt</h1>
  <p>
    <strong>The apt way to handle environment variables.</strong><br/>
    Read them as typed values, with zero runtime dependencies and the same API on Node, Bun, and Deno.
  </p>
  <a href="https://www.npmjs.com/package/envapt"><img alt="npm" src="https://img.shields.io/npm/v/envapt?logo=npm&logoColor=cb3838&label=%20&labelColor=103544&color=cb3838"></a>
  <a href="https://www.npmjs.com/package/envapt"><img alt="downloads" src="https://img.shields.io/npm/dm/envapt?style=flat&color=f7f6e8&labelColor=103544&label=downloads"></a>
  <a href="https://jsr.io/@materwelon/envapt"><img alt="jsr" src="https://jsr.io/badges/@materwelon/envapt"></a>
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/materwelonDhruv/envapt/checks.yml?branch=main&label=tests&style=flat&logo=github&color=3fb950&labelColor=103544">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/npm/l/envapt?style=flat&color=e97826&logo=apache&label="></a>
</td>
</tr>
</table>

---

`process.env` always hands you a `string | undefined`. envapt returns the type you asked for, with a
fallback that removes `undefined` from the return type.

```ts
import { Envapter } from 'envapt';

const port = Envapter.getNumber('PORT', 3000); // number, not string | undefined
```

**[Read the docs →](https://envapt.materwelon.dev)**

## What you get

- **Typed values.** A fallback removes `undefined` from the return type. Built-in converters cover
  numbers, booleans, bigint, JSON, URLs, regular expressions, dates, durations, and arrays, or pass
  your own function or a Standard Schema validator (zod, valibot, arktype).
- **Zero runtime dependencies.** envapt ships its own `.env` parser, so nothing is added to your
  dependency tree.
- **The same API on Node, Bun, and Deno.** Node `>=20`, Bun `>=1.3`, Deno `>=2.5`; ESM and CJS.
- **`.env` loading built in.** A per-environment file cascade, `${VAR}` templates, and strict /
  required checks.

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

Read a value anywhere, in JavaScript or TypeScript. No build step.

```ts
import { Envapter, Converters } from 'envapt';

const port = Envapter.getNumber('PORT', 3000);
const origins = Envapter.getUsing('ALLOWED_ORIGINS', Converters.array(), []);
```

### Decorator

Bind a value to a class field. TypeScript, with `experimentalDecorators` in your `tsconfig.json`.

```ts
import { Envapt, Converters } from 'envapt';

class Config {
    @Envapt('PORT', { converter: Converters.Number, fallback: 3000 })
    declare static readonly port: number;
}
```

## Documentation

The guide, converter reference, validation, configuration, and the v4 to v5 migration live at
**[envapt.materwelon.dev](https://envapt.materwelon.dev)**.

## Agent skill

Install the envapt agent skill so AI coding tools use the correct API:

```sh
npx skills add materwelonDhruv/envapt
```

---

<p align="center"><sub>Built by <a href="https://github.com/materwelondhruv">@materwelonDhruv</a> · Apache 2.0</sub></p>
