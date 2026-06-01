---
name: envapt
description: Type-safe environment variable access for TypeScript and JavaScript with the envapt library. Use when a project imports from 'envapt' or 'envapt/config', reads process.env, loads .env files, migrates off dotenv, or the user mentions envapt, Envapter, or @Envapt. Covers the functional Envapter reader API (get/getNumber/getBoolean/getUsing/parse/require) as the portable default, the @Envapt and @EnvNum/@EnvStr/@EnvBool/@EnvUrl/@EnvTime decorators, built-in and custom converters, Standard Schema (zod/valibot/arktype) validation, the .env cascade and baseDir, the Bun decorator limitation (bun#27575) and the declare-readonly requirement.
---

# envapt

envapt reads environment variables as typed, validated values, with an optional `.env` cascade layered
on top of `process.env`, and nothing in `dependencies` or `peerDependencies`. npm: `envapt`. JSR:
`@materwelon/envapt`. Minimums: Node >=20, Bun >=1.3, Deno >=2.5. Ships ESM and CJS.

Use this skill when a file imports from `'envapt'` or `'envapt/config'`, reads `process.env`, loads a
`.env`, migrates off dotenv, or the user names envapt / `Envapter` / `@Envapt`.

## Choosing the API: functional vs decorators

envapt has two surfaces. They read the same values through the same cache; pick by the project, not by
preference.

- **Default to the functional `Envapter` readers.** They work in JS and TS with no build step and no
  compiler flags, on every runtime envapt supports (Node, Bun, Deno).
- **Use the `@Envapt` decorators only when** the project is TypeScript, already leans decorator-style
  (existing `@`-decorators, `experimentalDecorators` in `tsconfig.json`/`deno.json`, a stack like NestJS
  or TypeORM), and has a build/transpile step.
- **Hard override, no exceptions:** if the project runs a `.ts` entry **directly on Bun** with no
  precompile (`tsc`/tsdown/Vite), never use the decorator, `@Envapt`. Bun emits TC39 decorators and ignores
  `experimentalDecorators` ([bun#27575](https://github.com/oven-sh/bun/issues/27575)), so a decorated
  property reads back `undefined` at runtime. Use the functional readers instead.

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

`@Envapt` binds a class property to a variable. The class does **not** need to extend anything; extend
`Envapter` only to also get the reader methods on the same class.

```ts
import { Envapt, Converters } from 'envapt';

class Config {
    @Envapt('PORT', { converter: Converters.Number, fallback: 3000 })
    declare static readonly port: number;

    @Envapt('DATABASE_URL', { converter: Converters.Url, required: true })
    declare static readonly databaseUrl: URL;
}
```

### Two rules that bite if you miss them

1. **Declare the property with `declare` and no initializer.** `@Envapt` installs a getter via
   `Object.defineProperty`. Under `useDefineForClassFields` (on by default for modern targets) a real
   field declaration emits a constructor assignment that overwrites the getter with `undefined`. Write
   `declare readonly x: T`, never `readonly x: T = ...` and never omit `declare`.
2. **Enable `experimentalDecorators`** in `tsconfig.json` (and `deno.json` on Deno):
   `{ "compilerOptions": { "experimentalDecorators": true } }`.

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
    @EnvNum('PORT', 3000) declare static readonly port: number;
    @EnvBool('DEBUG', false) declare static readonly debug: boolean;
    @EnvUrl('APP_URL', new URL('http://localhost:3000')) declare static readonly url: URL; // fallback is a URL, not a string
    @EnvTime('CACHE_TTL', '15m') declare static readonly cacheTtl: number; // resolves to milliseconds
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

## Loading .env files

By default envapt loads a per-environment cascade. Precedence is **most-specific-wins**:
`.env.<environment>.local` > `.env.<environment>` > `.env.local` > `.env`. (This is deliberately the
reverse of dotenv-flow / Next.js order.) Configure through statics on `Envapter`:

```ts
Envapter.baseDir = import.meta.dirname; // anchor relative .env resolution to this dir, not process.cwd()
Envapter.envPaths = ['.env', '.env.local']; // explicit paths; disables the auto-cascade. Set baseDir first.
Envapter.strict = true; // whitespace-only values count as missing
Envapter.syncProcessEnv = true; // mirror loaded keys into process.env
Envapter.environment; // Environment.Development | Staging | Production; also isProduction / isStaging / isDevelopment
```

`Envapter.configureProfiles({ ... })` sets per-environment path lists; `Envapter.debug` (or the
`ENVAPT_DEBUG` env var) turns on stderr logging.

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
`required` + `fallback`), `SchemaValidationFailed` (carries an `issues` array), `MalformedTimeFallback`.

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

| Gotcha                      | Rule                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Decorator reads `undefined` | Use `declare readonly x: T` with no initializer (the `useDefineForClassFields` footgun) |
| Decorator broken on Bun     | `@Envapt` does not work on Bun-direct `.ts` (bun#27575); use the functional API         |
| `@EnvUrl` fallback          | It's a `URL` instance, not a string: `new URL('...')`                                   |
| `Time` / `@EnvTime`         | Resolves to milliseconds; fallback is a ms number or a time string (`'15m'`)            |
| Schema fallback             | A fallback is returned as-is; only present env values pass through the schema           |
| `required` + `fallback`     | Mutually exclusive; so are `schema` + `converter`                                       |
| Cascade order               | Most-specific-wins: `.env.<env>.local` > `.env.<env>` > `.env.local` > `.env`           |

## Old patterns (recognize, then migrate)

<details>
<summary>Deprecated positional <code>@Envapt('KEY', fallback, Converter)</code> form</summary>

Pre-v5 code uses a positional signature: `@Envapt('PORT', 3000, Number)`. It is **deprecated in v5 and
removed in v6**, and it can only express a primitive-constructor converter (no built-in tokens, arrays,
custom functions, `schema`, or `required`). When you see it, migrate to the options object:

```ts
// old
@Envapt('PORT', 3000, Number) declare static readonly port: number;
// new
@Envapt('PORT', { converter: Converters.Number, fallback: 3000 }) declare static readonly port: number;
```

</details>

---

**Guardrail:** if a project runs `.ts` directly on Bun with no precompile step, never recommend
`@Envapt`, it reads `undefined` at runtime (bun#27575). Use the functional `Envapter` readers.

Full reference (every converter, method, and option): <https://envapt.materwelon.dev>
