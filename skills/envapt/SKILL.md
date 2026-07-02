---
name: envapt
description: Reads typed, validated config from process.env, .env files, or any bound source for TypeScript and JavaScript with the envapt library, on Node, Bun, Deno, Cloudflare Workers, and the browser. Use when the project imports from 'envapt' or 'envapt/config', when the user mentions envapt, Envapter, @Envapt, or the @EnvNum/@EnvStr/@EnvBool/@EnvUrl/@EnvTime sugar decorators, or when the task involves reading typed environment variables, loading .env files, validating env with zod/valibot/arktype, binding config on Cloudflare Workers or in the browser, or migrating off dotenv or the removed 'envapt/workerd' / 'envapt/browser' subpaths.
---

# envapt

envapt reads environment variables, or any config, as typed, validated values, with an optional `.env` cascade layered on top of `process.env`, and nothing in `dependencies` or `peerDependencies`. Available as `envapt` on npm and `@materwelon/envapt` on JSR. Minimum versions are Node >=20, Bun >=1.3, Deno >=2.5. Ships ESM and CJS. It also runs on Cloudflare Workers and in the browser, where you bind a source yourself and read with the same typed API (see the Runtimes and sources section below). Import from `envapt` everywhere; the package export conditions select the right build automatically.

## Choosing the API: functional vs decorators

envapt has two surfaces. They read the same values through the same cache; pick by the project, not by preference.

- **Default to the functional `Envapter` readers.** They work in JS and TS with no build step and no compiler flags, on every runtime envapt supports (Node, Bun, Deno, Cloudflare Workers, the browser). Off Node you bind a source first (see the Runtimes and sources section below).
- **The `@Envapt` decorators are TypeScript-only.** The default import is a TC39 Stage 3 accessor decorator, so it needs no `experimentalDecorators` flag and runs on any runtime that handles Stage 3 decorators, including Bun and Deno executing a `.ts` file directly. Reach for it on a TS project that wants config on typed fields.
- **Legacy decorators live at `envapt/legacy`.** Use them only when the project already runs on `experimentalDecorators`. They keep the old `static readonly` / `declare readonly` form and do NOT work on a `.ts` entry run directly on Bun ([bun#27575](https://github.com/oven-sh/bun/issues/27575)), so prefer the default accessor form or the functional readers there.

## Functional API (the portable default)

`Envapter` exposes the readers as both static methods and instance methods with identical signatures. Every key argument accepts a single string or an ordered array (first key that has a value wins).

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
Envapter.getRequired('PORT', Converters.Number); // throws if unset
```

`Envapter.resolve` is a tagged template that interpolates env values: ``Envapter.resolve`postgres://${'DB_HOST'}:${'DB_PORT'}` ``. `Envapter.getRaw('KEY')` returns the raw string with no parsing.

## Decorators

`@Envapt` binds a class property to a variable. The default import is a TC39 Stage 3 accessor decorator, declared with the `accessor` keyword. The class does **not** need to extend anything, extend `Envapter` only to also get the reader methods on the same class.

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

Declare the field with the `accessor` keyword. Static fields use `static accessor x: T`, instance fields use `accessor x!: T` with the definite-assignment `!`. No `readonly`, no `declare`, no initializer, and no `experimentalDecorators` flag. The accessor is read-only, assigning to it throws `EnvaptError`.

The legacy form (`envapt/legacy`) differs. Static fields use a plain `static readonly x: T` and instance fields use `declare readonly x: T` (both no initializer), and `experimentalDecorators` must be on in `tsconfig.json` (and `deno.json` on Deno). A module that imports decorators only from `envapt/legacy` must also `import 'envapt'` once so the runtime source binds.

### Options object

`@Envapt(key, options)` accepts: `{ fallback }`, `{ converter, fallback }`, `{ converter }`, `{ converter, required: true }`, `{ required: true }` (raw string, throws on missing), and `{ schema }` / `{ schema, fallback }`. `required` and `fallback` are mutually exclusive; `schema` and `converter` are mutually exclusive. A bad combination throws `EnvaptError` when the decorator is applied, before any access.

### Shorthand decorators

`@EnvNum`, `@EnvStr`, `@EnvBool`, `@EnvUrl`, `@EnvTime` wrap `@Envapt` with a fixed converter. The call site is the key plus an optional fallback (typed to the converter). They take a fallback only: for `required`, a `schema`, an array, or a custom function, use `@Envapt` with the options object.

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

`Converters` carries the scalar tokens: `String`, `Number`, `Integer`, `Float`, `Boolean`, `Bigint`, `Symbol`, `Json`, `Url`, `Regexp`, `Date`, `Time`. `Time` resolves to **milliseconds** (fallback is a ms number or a time string like `'10s'`/`'15m'`), and `Url` resolves to a **`URL` instance** (its fallback must be a `URL`, not a string).

Arrays use the builder. `of` defaults to `Converters.String`, `delimiter` to `','`; `of` accepts any scalar token except `json` and `regexp`, or a custom element function.

```ts
Converters.array({ of: Converters.Number, delimiter: ';' }); // "1;2;3" -> number[]
```

Custom converters have **two different shapes**:

- **Top-level** (`@Envapt({ converter })`, `getWith`) with signature `(raw: string | undefined, fallback) => T`. Gets the raw value (possibly `undefined`) and the fallback.
- **Array element** (`Converters.array({ of })`) with signature `(raw: string) => T`. Gets one trimmed, non-empty slot; no `undefined`, no fallback.

## Runtimes and sources

envapt reads through a pluggable `Source`, and the build you import binds the right one. Import from `envapt` everywhere; the `exports` conditions select the build automatically.

- **Node, Bun, and Deno** (`import ... from 'envapt'`): a `FileSource` is bound automatically (a `process.env` snapshot plus the `.env` cascade). Nothing to wire up.
- **Cloudflare Workers** (`import ... from 'envapt'`): bind the `env` binding yourself, once, before any read.

    ```ts
    import { Envapter, PortableSource } from 'envapt';
    import { env } from 'cloudflare:workers'; // or the `env` passed to fetch(request, env)

    Envapter.useSource(new PortableSource(env)); // bind once at module load
    ```

- **Browser** (`import ... from 'envapt'`): seed a `PortableSource` from the object your bundler injects.

    ```ts
    import { Envapter, PortableSource } from 'envapt';

    Envapter.useSource(new PortableSource(import.meta.env)); // Vite; or a webpack DefinePlugin object
    ```

`PortableSource` snapshots the object and JSON-stringifies non-string values, so you pass the runtime's object straight through. Any object with a `readVars(): Record<string, string>` method is a valid `Source`.

On the portable build (Workers, the browser, edge runtimes) there is no filesystem: the file-only config APIs (`envPaths`, `baseDir`, `envFileOptions`, `configureProfiles`, `resetProfiles`) warn once and no-op by default. Set `Envapter.fileApiMode = 'throw'` to make them throw `EnvaptError` `FileApiUnsupported` instead. A read before `useSource` throws `NoSourceBound` regardless of `fileApiMode`.

## Loading .env files

By default envapt loads a per-environment cascade. Precedence is **most-specific-wins**: `.env.<environment>.local` > `.env.<environment>` > `.env.local` > `.env`. (This is deliberately the reverse of dotenv-flow / Next.js order.) Configure through statics on `Envapter`:

```ts
Envapter.baseDir = import.meta.dirname; // anchor relative .env resolution to this dir, not process.cwd()
Envapter.envPaths = ['.env', '.env.local']; // explicit paths; disables the auto-cascade. Set baseDir first.
Envapter.strict = true; // whitespace-only values count as missing
Envapter.syncProcessEnv = true; // mirror loaded keys into process.env
Envapter.environment; // Environment.Development | Staging | Production | Test; also isProduction / isStaging / isDevelopment / isTest
```

The environment is detected from the first set of `ENVIRONMENT` -> `ENV` -> `NODE_ENV` -> `MODE` (case-insensitive; `MODE` covers Vite browser builds), defaulting to development. `Envapter.configureProfiles({ ... })` sets per-environment path lists (node build only, like `baseDir` / `envPaths`); `Envapter.debug` (or the `ENVAPT_DEBUG` env var) turns on logging.

### Drop-in for dotenv

`import 'envapt/config'` loads the cascade and mirrors every key into `process.env`. It is the `dotenv/config` replacement:

```ts
import 'envapt/config'; // ESM, top of entry
// node --import envapt/config app.js   (preload)
// node -r envapt/config app.cjs        (CJS preload)
```

## Validation with Standard Schema

`Envapter.parse` (and `@Envapt({ schema })`) validates through any Standard Schema validator: zod, valibot, arktype, or a hand-rolled `StandardSchemaV1`. The result type is the schema's output.

```ts
import { z } from 'zod/v4';
Envapter.parse('PORT', z.coerce.number().int().min(1024).max(65535)); // number
```

Two constraints: validation is **sync-only** (an async `validate` throws), and a **fallback is returned as-is and is NOT passed through the schema**, only a present env value is validated.

## Errors

Reader and decorator failures throw `EnvaptError` with a numeric `code` (`EnvaptErrorCodes`). The common error codes are `MissingEnvValue` (a `required` value is absent), `InvalidUserDefinedConfig` (bad options, e.g. `required` + `fallback`), `SchemaValidationFailed` (carries an `issues` array), `MalformedTimeFallback`, `FileApiUnsupported` (a file-only API called with `fileApiMode = 'throw'`, or on the node build with a non-filesystem source), `NoSourceBound` (a read before `useSource` on the portable build).

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

envapt loads `.env` **and** returns typed, validated values from one API, with nothing in `dependencies` or `peerDependencies`.

| dotenv                               | envapt                                                    |
| ------------------------------------ | --------------------------------------------------------- |
| `require('dotenv').config()`         | `import 'envapt/config'`                                  |
| `-r dotenv/config`                   | `-r envapt/config` (CJS) / `--import envapt/config` (ESM) |
| `process.env.API_KEY`                | `Envapter.get('API_KEY')` / `Envapter.require('API_KEY')` |
| `Number(process.env.PORT) \|\| 3000` | `Envapter.getNumber('PORT', 3000)`                        |
| `process.env.DEBUG === 'true'`       | `Envapter.getBoolean('DEBUG', false)`                     |

## Gotchas

| Gotcha | Rule |
| --- | --- |
| Wrong decorator field form | Modern uses `static accessor x: T` / `accessor x!: T`. Legacy (`envapt/legacy`) uses `static readonly x: T` / `declare readonly x: T`, both no initializer |
| Legacy decorator on Bun | The `envapt/legacy` form reads `undefined` on Bun-direct `.ts` (bun#27575). The default accessor decorators on `envapt` work there |
| `@EnvUrl` fallback | It's a `URL` instance, not a string: `new URL('...')` |
| `Time` / `@EnvTime` | Resolves to milliseconds; fallback is a ms number or a time string (`'15m'`) |
| Schema fallback | A fallback is returned as-is; only present env values pass through the schema |
| `required` + `fallback` | Mutually exclusive; so are `schema` + `converter` |
| Cascade order | Most-specific-wins: `.env.<env>.local` > `.env.<env>` > `.env.local` > `.env` |
| Off Node (Workers/browser) | Import from `envapt`; call `Envapter.useSource(...)` before reading (else `NoSourceBound`); file APIs warn once and no-op by default (`fileApiMode = 'throw'` to throw `FileApiUnsupported`) |

## Old patterns (recognize, then migrate)

<details>
<summary>Deprecated positional <code>@Envapt('KEY', fallback, Converter)</code> form</summary>

Pre-v5 code uses a positional signature: `@Envapt('PORT', 3000, Number)`. It is **deprecated in v5 and removed in v6**, and it can only express a primitive-constructor converter (no built-in tokens, arrays, custom functions, `schema`, or `required`). When you see it, migrate to the options object:

```ts
// old
@Envapt('PORT', 3000, Number) static readonly port: number;
// new
@Envapt('PORT', { converter: Converters.Number, fallback: 3000 }) static accessor port: number;
```

</details>

<details>
<summary>Pre-v7 legacy decorator field form (<code>static readonly</code> / <code>declare readonly</code>)</summary>

Pre-v7 code imports `@Envapt` from `envapt` and declares fields with `static readonly` / `declare readonly`. In v7 the default `envapt` decorators are TC39 accessors. Migrate the fields to `static accessor x: T` / `accessor x!: T`, or keep the old form by importing from `envapt/legacy` (which still needs `experimentalDecorators`).

```ts
// pre-v7 (now the legacy form, still on envapt/legacy)
@Envapt('PORT', { fallback: 3000 }) static readonly port: number;
// v7 default
@Envapt('PORT', { fallback: 3000 }) static accessor port: number;
```

</details>

<details>
<summary>Removed in v8: <code>envapt/workerd</code> and <code>envapt/browser</code> subpaths</summary>

In v8 these subpaths were removed. Import from `envapt` directly; the package `exports` conditions resolve the portable build on Workers, edge runtimes, the browser, and react-native automatically. No type-only subpath is needed: the portable types now include the file-only APIs, which warn once and no-op by default (set `Envapter.fileApiMode = 'throw'` for a hard `FileApiUnsupported` error).

```ts
// v7 and earlier
import { Envapter, WorkerEnvSource } from 'envapt/workerd';
import { Envapter, ManualEnvSource } from 'envapt/browser';

// v8
import { Envapter, PortableSource } from 'envapt';
```

</details>

---

**Guardrail:** on a `.ts` entry run directly on Bun with no precompile, the legacy `envapt/legacy` decorators read `undefined` at runtime (bun#27575). The default accessor decorators on `envapt` work there, or use the functional `Envapter` readers.

Full reference (every converter, method, and option): <https://envapt.materwelon.dev>
