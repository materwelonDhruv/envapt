---
name: envapt
description: Type-safe config reading and environment variable access for TypeScript and JavaScript with the envapt library. Use when a project imports from 'envapt', 'envapt/config', 'envapt/workerd', or 'envapt/browser', reads process.env or any object as a source, loads .env files, runs on Cloudflare Workers or in the browser, migrates off dotenv, or the user mentions envapt, Envapter, or @Envapt. Covers the functional Envapter reader API (get/getNumber/getBoolean/getUsing/parse/require) as the portable default, the @Envapt and @EnvNum/@EnvStr/@EnvBool/@EnvUrl/@EnvTime decorators (modern TC39 accessor form on 'envapt', legacy experimentalDecorators form on 'envapt/legacy'), built-in and custom converters, Standard Schema (zod/valibot/arktype) validation, the .env cascade and baseDir, the pluggable EnvSource API (useSource with WorkerEnvSource and ManualEnvSource) for Cloudflare Workers and the browser, the accessor field declaration rule, and the legacy-only Bun decorator limitation (bun#27575).
---

# envapt

envapt reads environment variables as typed, validated values, with an optional `.env` cascade layered
on top of `process.env`, and nothing in `dependencies` or `peerDependencies`. npm: `envapt`. JSR:
`@materwelon/envapt`. Minimums: Node >=20, Bun >=1.3, Deno >=2.5. Ships ESM and CJS. It also runs on
Cloudflare Workers (import from `envapt/workerd`) and in the browser (`envapt/browser`), where you bind
a source yourself (see the Runtimes and sources section below).

Use this skill when a file imports from `'envapt'`, `'envapt/config'`, `'envapt/workerd'`, or
`'envapt/browser'`, reads `process.env`, loads a `.env`, runs on Workers or the browser, migrates off
dotenv, or the user names envapt / `Envapter` / `@Envapt`.

## Choosing the API: functional vs decorators

envapt has two surfaces. They read the same values through the same cache; pick by the project, not by
preference.

- **Default to the functional `Envapter` readers.** They work in JS and TS with no build step and no
  compiler flags, on every runtime envapt supports (Node, Bun, Deno, Cloudflare Workers, the browser).
  Off Node you bind a source first (see the Runtimes and sources section below).
- **The `@Envapt` decorators are TypeScript-only.** The default import is a TC39 Stage 3 accessor
  decorator, so it needs no `experimentalDecorators` flag and runs on any runtime that handles Stage 3
  decorators, including Bun and Deno executing a `.ts` file directly. Reach for it on a TS project that
  wants config on typed fields.
- **Legacy decorators live at `envapt/legacy`.** Use them only when the project already runs on
  `experimentalDecorators`. They keep the old `static readonly` / `declare readonly` form and do NOT work
  on a `.ts` entry run directly on Bun ([bun#27575](https://github.com/oven-sh/bun/issues/27575)), so
  prefer the default accessor form or the functional readers there.

## Functional API (the portable default)

`Envapter` exposes the readers as both static methods and instance methods with identical signatures.
Every key argument accepts a single string or an ordered array (first key that has a value wins).

```ts
import { Envapter, Converters } from 'envapt';

Envapter.get('API_KEY'); // string | undefined
Envapter.get('API_KEY', 'dev-key'); // string
Envapter.getNumber('PORT', 3000); // number
Envapter.getBoolean('DEBUG', false); // boolean; true set: 1/yes/true/on, false set: 0/no/false/off
Envapter.getBigInt('MAX', 0n); // bigint
Envapter.get(['CANARY_URL', 'APP_URL']); // ordered fallback

// Built-in or array converter:
Envapter.getUsing('ORIGINS', Converters.array({ of: Converters.String }), []); // string[]
// Custom function converter (raw is the string, or undefined when unset):
Envapter.getWith('FLAGS', (raw) => (raw ? raw.split(',') : [])); // string[]

// Throw instead of returning a fallback:
Envapter.require('DATABASE_URL', 'JWT_SECRET'); // throws EnvaptError listing every missing key
Envapter.getUsing('PORT', { converter: Converters.Number, required: true }); // options-bag form, throws if unset
```

`Envapter.resolve` is a tagged template that interpolates env values: ``Envapter.resolve`postgres://${'DB_HOST'}:${'DB_PORT'}` ``.
`Envapter.getRaw('KEY')` returns the raw string with no parsing.

## Decorators

`@Envapt` binds a class property to a variable. The default import is a TC39 Stage 3 accessor decorator,
declared with the `accessor` keyword. The class does **not** need to extend anything, extend `Envapter`
only to also get the reader methods on the same class.

```ts
import { Envapt, Converters } from 'envapt';

class Config {
    @Envapt('PORT', { converter: Converters.Number, fallback: 3000 })
    static accessor port: number;

    @Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
    static accessor databaseUrl: URL;
}
```

### Field declaration

Declare the field with the `accessor` keyword. Static fields use `static accessor x: T`, instance fields
use `accessor x!: T` with the definite-assignment `!`. No `readonly`, no `declare`, no initializer, and no
`experimentalDecorators` flag. The accessor is read-only, assigning to it throws `EnvaptError`.

The legacy form (`envapt/legacy`) differs. Static fields use a plain `static readonly x: T` and instance
fields use `declare readonly x: T` (both no initializer), and `experimentalDecorators` must be on in
`tsconfig.json` (and `deno.json` on Deno). A module that imports decorators only from `envapt/legacy` must
also `import 'envapt'` once so the runtime source binds.

### Options object

`@Envapt(key, options)` accepts: `{ fallback }`, `{ converter, fallback }`, `{ converter }`,
`{ converter, required: true }`, `{ required: true }` (raw string, throws on missing), and
`{ schema }` / `{ schema, fallback }`. `required` and `fallback` are mutually exclusive; `schema` and
`converter` are mutually exclusive. A bad combination throws `EnvaptError` when the decorator is applied,
before any access.

### Shorthand decorators

`@EnvNum`, `@EnvStr`, `@EnvBool`, `@EnvUrl`, `@EnvTime` wrap `@Envapt` with a fixed converter. The call
site is the key plus an optional fallback (typed to the converter). They take a fallback only: for
`required`, a `schema`, an array, or a custom function, use `@Envapt` with the options object.

```ts
import { EnvNum, EnvBool, EnvUrl, EnvTime } from 'envapt';

class Config {
    @EnvNum('PORT', 3000) static accessor port: number;
    @EnvBool('DEBUG', false) static accessor debug: boolean;
    @EnvUrl('APP_URL', new URL('http://localhost:3000')) static accessor url: URL; // fallback is a URL, not a string
    @EnvTime('CACHE_TTL', '15m') static accessor cacheTtl: number; // resolves to milliseconds
}
```

## Converters

`Converters` carries the scalar tokens: `String`, `Number`, `Integer`, `Float`, `Boolean`, `Bigint`,
`Symbol`, `Json`, `Url`, `Regexp`, `Date`, `Time`. Two facts that surprise people: `Time` resolves to
**milliseconds** (fallback is a ms number or a time string like `'10s'`/`'15m'`), and `Url` resolves to a
**`URL` instance** (its fallback must be a `URL`, not a string).

Arrays use the builder. `of` defaults to `Converters.String`, `delimiter` to `','`; `of` accepts any
scalar token except `json` and `regexp`, or a custom element function.

```ts
Converters.array({ of: Converters.Number, delimiter: ';' }); // "1;2;3" -> number[]
```

Custom converters have **two different shapes**:

- **Top-level** (`@Envapt({ converter })`, `getWith`): `(raw: string | undefined, fallback) => T`. Gets
  the raw value (possibly `undefined`) and the fallback.
- **Array element** (`Converters.array({ of })`): `(raw: string) => T`. Gets one trimmed, non-empty slot;
  no `undefined`, no fallback.

## Runtimes and sources

envapt reads through a pluggable `EnvSource`, and the build you import binds the right one.

- **Node, Bun, Deno** (`import ... from 'envapt'`): a `NodeEnvSource` is bound automatically (a
  `process.env` snapshot plus the `.env` cascade). Nothing to wire up.
- **Cloudflare Workers** (`import ... from 'envapt/workerd'`): bind the `env` binding yourself, once,
  before any read.

    ```ts
    import { Envapter, WorkerEnvSource } from 'envapt/workerd';
    import { env } from 'cloudflare:workers'; // or the `env` passed to fetch(request, env)

    Envapter.useSource(new WorkerEnvSource(env)); // bind once at module load
    ```

- **Browser** (`import ... from 'envapt/browser'`): seed a `ManualEnvSource` from the object your
  bundler injects.

    ```ts
    import { Envapter, ManualEnvSource } from 'envapt/browser';

    Envapter.useSource(new ManualEnvSource(import.meta.env)); // Vite; or a webpack DefinePlugin object
    ```

`WorkerEnvSource` and `ManualEnvSource` both snapshot the object and JSON-stringify non-string values,
so you pass the runtime's object straight through. Any object with a `readVars(): Record<string, string>`
method is a valid `EnvSource`.

Off Node there is no filesystem: the `.env` cascade and the file-only APIs (`envPaths`, `baseDir`,
`envFileOptions`, `configureProfiles`, `resetProfiles`) are absent and throw `EnvaptError`
`FileApiUnsupported`; a read before `useSource` throws `NoSourceBound`. Import from `envapt/workerd` /
`envapt/browser`, not bare `envapt`: the dedicated entries omit the file APIs from the type, so a stray
call is a compile error, while bare `envapt` falls back to the Node types where it only fails at runtime.

## Loading .env files

By default envapt loads a per-environment cascade. Precedence is **most-specific-wins**:
`.env.<environment>.local` > `.env.<environment>` > `.env.local` > `.env`. (This is deliberately the
reverse of dotenv-flow / Next.js order.) Configure through statics on `Envapter`:

```ts
Envapter.baseDir = import.meta.dirname; // anchor relative .env resolution to this dir, not process.cwd()
Envapter.envPaths = ['.env', '.env.local']; // explicit paths; disables the auto-cascade. Set baseDir first.
Envapter.strict = true; // whitespace-only values count as missing
Envapter.syncProcessEnv = true; // mirror loaded keys into process.env
Envapter.environment; // Environment.Development | Staging | Production | Test; also isProduction / isStaging / isDevelopment / isTest
```

The environment is detected from the first set of `ENVIRONMENT` -> `ENV` -> `NODE_ENV` -> `MODE`
(case-insensitive; `MODE` covers Vite browser builds), defaulting to development.
`Envapter.configureProfiles({ ... })` sets per-environment path lists (Node only, like `baseDir` /
`envPaths`); `Envapter.debug` (or the `ENVAPT_DEBUG` env var) turns on logging.

### Drop-in for dotenv

`import 'envapt/config'` loads the cascade and mirrors every key into `process.env`. It is the
`dotenv/config` replacement:

```ts
import 'envapt/config'; // ESM, top of entry
// node --import envapt/config app.js   (preload)
// node -r envapt/config app.cjs        (CJS preload)
```

## Validation with Standard Schema

`Envapter.parse` (and `@Envapt({ schema })`) validates through any Standard Schema validator: zod,
valibot, arktype, or a hand-rolled `StandardSchemaV1`. The result type is the schema's output.

```ts
import { z } from 'zod/v4';
Envapter.parse('PORT', z.coerce.number().int().min(1024).max(65535)); // number
```

Two constraints: validation is **sync-only** (an async `validate` throws), and a **fallback is returned
as-is and is NOT passed through the schema**, only a present env value is validated.

## Errors

Reader and decorator failures throw `EnvaptError` with a numeric `code` (`EnvaptErrorCodes`). The common
ones: `MissingEnvValue` (a `required` value is absent), `InvalidUserDefinedConfig` (bad options, e.g.
`required` + `fallback`), `SchemaValidationFailed` (carries an `issues` array), `MalformedTimeFallback`,
`FileApiUnsupported` (a file-only API called off Node), `NoSourceBound` (a read before `useSource` off Node).

```ts
import { EnvaptError, EnvaptErrorCodes } from 'envapt';
try {
    Envapter.require('DATABASE_URL');
} catch (err) {
    if (err instanceof EnvaptError && err.code === EnvaptErrorCodes.MissingEnvValue) {
        /* handle */
    }
}
```

## Migrating from dotenv

envapt loads `.env` **and** returns typed, validated values from one API, with nothing in
`dependencies` or `peerDependencies`.

| dotenv                               | envapt                                                    |
| ------------------------------------ | --------------------------------------------------------- |
| `require('dotenv').config()`         | `import 'envapt/config'`                                  |
| `-r dotenv/config`                   | `-r envapt/config` (CJS) / `--import envapt/config` (ESM) |
| `process.env.API_KEY`                | `Envapter.get('API_KEY')` / `Envapter.require('API_KEY')` |
| `Number(process.env.PORT) \|\| 3000` | `Envapter.getNumber('PORT', 3000)`                        |
| `process.env.DEBUG === 'true'`       | `Envapter.getBoolean('DEBUG', false)`                     |

## Gotchas

| Gotcha                      | Rule                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wrong decorator field form  | Modern uses `static accessor x: T` / `accessor x!: T`. Legacy (`envapt/legacy`) uses `static readonly x: T` / `declare readonly x: T`, both no initializer                                        |
| Legacy decorator on Bun     | The `envapt/legacy` form reads `undefined` on Bun-direct `.ts` (bun#27575). The default accessor decorators on `envapt` work there                                                                        |
| `@EnvUrl` fallback          | It's a `URL` instance, not a string: `new URL('...')`                                                                                                  |
| `Time` / `@EnvTime`         | Resolves to milliseconds; fallback is a ms number or a time string (`'15m'`)                                                                           |
| Schema fallback             | A fallback is returned as-is; only present env values pass through the schema                                                                          |
| `required` + `fallback`     | Mutually exclusive; so are `schema` + `converter`                                                                                                      |
| Cascade order               | Most-specific-wins: `.env.<env>.local` > `.env.<env>` > `.env.local` > `.env`                                                                          |
| Off Node (Workers/browser)  | Import from `envapt/workerd` / `envapt/browser`; `Envapter.useSource(...)` before reading (else `NoSourceBound`); file APIs throw `FileApiUnsupported` |

## Old patterns (recognize, then migrate)

<details>
<summary>Deprecated positional <code>@Envapt('KEY', fallback, Converter)</code> form</summary>

Pre-v5 code uses a positional signature: `@Envapt('PORT', 3000, Number)`. It is **deprecated in v5 and
removed in v6**, and it can only express a primitive-constructor converter (no built-in tokens, arrays,
custom functions, `schema`, or `required`). When you see it, migrate to the options object:

```ts
// old
@Envapt('PORT', 3000, Number) static readonly port: number;
// new
@Envapt('PORT', { converter: Converters.Number, fallback: 3000 }) static accessor port: number;
```

</details>

<details>
<summary>Pre-v7 legacy decorator field form (<code>static readonly</code> / <code>declare readonly</code>)</summary>

Pre-v7 code imports `@Envapt` from `envapt` and declares fields with `static readonly` / `declare readonly`.
In v7 the default `envapt` decorators are TC39 accessors. Migrate the fields to `static accessor x: T` /
`accessor x!: T`, or keep the old form by importing from `envapt/legacy` (which still needs
`experimentalDecorators`).

```ts
// pre-v7 (now the legacy form, still on envapt/legacy)
@Envapt('PORT', { fallback: 3000 }) static readonly port: number;
// v7 default
@Envapt('PORT', { fallback: 3000 }) static accessor port: number;
```

</details>

---

**Guardrail:** on a `.ts` entry run directly on Bun with no precompile, the legacy `envapt/legacy`
decorators read `undefined` at runtime (bun#27575). The default accessor decorators on `envapt` work
there, or use the functional `Envapter` readers.

Full reference (every converter, method, and option): <https://envapt.materwelon.dev>
