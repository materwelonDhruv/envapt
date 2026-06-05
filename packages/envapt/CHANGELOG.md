# envapt

## 5.2.0-next.0

### Minor Changes

- e506a6d: `Envapter` now detects the test environment and reads Vite's `MODE`.
    - `Environment.Test` and `Envapter.isTest` are added. `NODE_ENV=test` (and Vite's `MODE=test`) now resolve to `Environment.Test`, where they previously fell through to `Development`. As a result, `isDevelopment` is no longer `true` under a test runner that sets `NODE_ENV=test`.
    - `MODE` joins the detection chain, after `ENVIRONMENT`, `ENV`, and `NODE_ENV`. Vite-family browser builds expose `import.meta.env.MODE` but none of the others, so `new ManualEnvSource(import.meta.env)` now sets the environment from `MODE`.
    - Environment names match case-insensitively. Previously `staging` was matched case-sensitively, so `STAGING` or `Staging` fell through to `Development`; `production` was already case-insensitive.
    - When no environment key is set, or its value is unrecognized, detection defaults to `Development` and emits a debug warning (visible with `Envapter.debug = 'warn'`).

- e506a6d: envapt now runs on the browser and Cloudflare Workers, not only Node. The engine reads variables through a pluggable `EnvSource` instead of reading `process.env` directly, so the same `Envapter` and `@Envapt` API works against an injected object or a Workers binding.

    `Envapter.useSource(source)` binds the source; the bound source then backs every read, the `.env` cascade, and `Envapter.syncProcessEnv`. Built-in sources, all exported from `envapt`:
    - `NodeEnvSource`: a `process.env` snapshot plus the `.env` cascade. Bound automatically on Node, Bun, and Deno, so you do not call `useSource` yourself.
    - `WorkerEnvSource`: reads a Cloudflare Workers `env` binding. Non-string bindings are JSON-stringified so the converters still apply.
    - `ManualEnvSource`: reads any object you pass in, snapshotted at construction, with non-string values JSON-stringified like `WorkerEnvSource`. Pass `import.meta.env` or a bundler-injected object directly on the browser, or a plain object in tests.

    ```ts
    import { Envapter, ManualEnvSource } from 'envapt';

    Envapter.useSource(new ManualEnvSource({ PORT: '3000', FLAG: 'true' }));
    Envapter.getNumber('PORT'); // 3000
    ```

    The core imports no `node:*` module: `node:fs`, `node:path`, `node:process`, and `node:url` are confined to `NodeEnvSource`. envapt ships a build per runtime, so a Workers or browser bundle pulls in no Node built-ins, and workerd needs no `nodejs_compat` flag. Bare `envapt` resolves the right build through the `exports` conditions, and the dedicated `envapt/workerd` and `envapt/browser` entries add the matching types, which omit the file-only APIs so a stray call is a compile error rather than a runtime `FileApiUnsupported`.

    Two new `EnvaptErrorCodes` replace silent no-ops with a thrown error:
    - `NoSourceBound` (307): thrown on the first read when no source is bound.
    - `FileApiUnsupported` (306): thrown when `envPaths`, `baseDir`, or `configureProfiles` is called on a source without a filesystem.

    `EnvSource` is a union of `BareEnvSource` (no filesystem) and `FileEnvSource` (which requires `readFile`, `resolvePath`, `normalizeBaseDir`, and `writeVars` together), so a custom source has either the full file API or none of it.

    On Node, the `.env` cascade now loads when envapt is first imported rather than on the first variable read.

### Patch Changes

- e506a6d: `Converters.Time` string fallbacks now accept decimals, matching raw env values.

    A fallback like `'1.5h'` previously threw `MalformedTimeFallback` even though the `TimeFallback` type (`` `${number}${TimeUnit}` ``) accepts it at compile time. Raw env values already allowed decimals, so the restriction only applied to fallbacks, which was inconsistent. A string fallback still requires an explicit unit (a unitless number is a number fallback), but `'1.5h'` now resolves to `5400000`.

## 5.1.1

### Patch Changes

- Embed the README into the published npm manifest so it renders on the package page. pnpm leaves the README out of the manifest by default, which left npmjs.com showing no README on every prior release.

## 5.1.0

### Minor Changes

- Emit one output module per source file (`unbundle`) so bundlers can tree-shake standalone imports: importing only `EnvaptError` or `Converters` now drops roughly 92-98% of gzip size, while the full `Envapter` path is unchanged.

## 5.0.3

### Patch Changes

- Update homepage in package.json

## 5.0.2

### Patch Changes

- 1ac6429: Tighten README positioning and claims.

## 5.0.1

### Patch Changes

- Replace the README hero table with a borderless side-by-side layout so GitHub and npm no longer draw table chrome (or the heading underline) around it, and drop the rule between the hero and the intro.

## 5.0.0

### Major Changes

- 9711554: **BREAKING:** array converters now use a phantom-branded `Converters.array({ of?, delimiter? })` builder instead of the `{ delimiter, type }` config object. inference survives variable indirection and union-widening, and bad element values in the raw env value throw `EnvaptError` (`ArrayElementConversionFailed`, code 206) instead of silently substituting the raw string into a wrong-typed array.

    Migration:

    ```ts
    // before
    @Envapt('PORTS', { converter: { delimiter: ',', type: Converters.Number }, fallback: [] })
    @Envapt('TAGS', { converter: Converters.Array, fallback: [] })

    // after
    @Envapt('PORTS', { converter: Converters.array({ of: Converters.Number }), fallback: [] })
    @Envapt('TAGS', { converter: Converters.array(), fallback: [] })
    ```

    **BREAKING:** `Converters` migrates from a TS `enum` to an `as const` object so envapt source stays compatible with `erasableSyntaxOnly` / Node's native TS execution. call sites are unchanged (`Converters.Number === 'number'` still holds), but `Converters` is no longer usable as a type. use `ConverterToken` instead.

    **BREAKING:** `Converters.Array` token is gone (use `Converters.array()`). the `ArrayConverter` and `ValidArrayConverterBuiltInType` types are gone (replaced by `ArrayOf<TElement>` and `ArrayElement`).

    new: `of:` accepts a custom `(raw: string) => T` function. the array element type is inferred from the function's return type, so `Converters.array({ of: (raw) => User.parse(raw) })` types the property as `User[]`.

    new: `Converters.array({ of: Converters.Time })` accepts `TimeFallback[]` (e.g. `['5s', '10m']`) as a fallback, matching the existing scalar `Converters.Time` asymmetry. string fallbacks are coerced to milliseconds at resolve time.

    `Envapter.getUsing` now routes through the parser whenever a fallback is provided, so `TimeFallback` / `TimeFallback[]` fallbacks are coerced consistently with the `@Envapt` decorator path. fixes a pre-existing inconsistency where `Envapter.getUsing('MISSING', Converters.Time, '10s')` returned `'10s'` instead of `10000`.

- 9711554: Add `Envapter.debug` three-level log toggle. Removes the `debug` key from the env-file options object.
    - New `Envapter.debug = 'silent' | 'warn' | 'verbose'` (default `silent`). Output goes to stderr prefixed with `[envapt]`.
    - New `ENVAPT_DEBUG` env var. Read lazily on first access if the setter was never called; the setter wins after that.
    - `warn` level: failed `.env` reads, unresolved `${VAR}` templates (non-strict path), fallback values used in place of missing env.
    - `verbose` level: everything in `warn` plus effective `.env` paths during cache rebuild, the cache-cleared notice, per-file key counts, and per-key load lines.
    - New `DebugLevel` type re-exported from the package root.
    - Invalid setter values throw `EnvaptError(InvalidUserDefinedConfig)` with a list of the accepted levels.
    - **Breaking**: the `debug` key on the env-file options object is removed. Use `Envapter.debug = 'verbose'` (or `ENVAPT_DEBUG=verbose`) instead. The corresponding `[dotenv]`-prefixed lines are gone; all debug output now flows through the unified `[envapt]` surface.

- 9711554: **BREAKING:** dropped `dotenv` as a runtime dependency. envapt now has **zero runtime deps**. A small internal `.env` parser ships inline (`src/Dotenv.ts`) that handles the subset of dotenv semantics envapt actually relies on: KEY=VALUE pairs, `export KEY=...` prefix, single / double / backtick quotes (with `\n`, `\r`, `\t`, `\\`, `\"` escape interpretation for double quotes), multi-line quoted values, inline `# comments`, multiple paths with first-wins (or `override: true`), and `encoding` for non-UTF8 files. End-user behavior is unchanged: the existing test suite (357 tests) passes against the new parser.

    **BREAKING:** `Envapter.envFileOptions` no longer accepts `quiet` or `DOTENV_KEY`.
    - `quiet` existed only to suppress dotenv's marketing tips. envapt never prints anything from the loader, so the option is meaningless. The default `_userDefinedDotenvConfig` is now `{}` instead of `{ quiet: true }`.
    - `DOTENV_KEY` was for `dotenv-vault` encrypted `.env` files. Not exercised by any envapt test and out of scope for envapt's internal parser. If you need encrypted env files, decrypt them externally and pass the resulting `.env` path to `Envapter.envPaths`.

    Passing either key to `Envapter.envFileOptions = { ... }` now throws `InvalidUserDefinedConfig` (302). The remaining allowed keys are `encoding` and `override`.

    **BREAKING:** the env-file options accessor was renamed from `Envapter.dotenvConfig` to `Envapter.envFileOptions` (type `DotenvConfigOptions` to `EnvFileOptions`), since it no longer relates to the dropped `dotenv` package.

- 9711554: Add global `Envapter.strict` flag, `required: true` option, and `Envapter.require()` for boot-time existence checks.
    - New `Envapter.strict` flag (default `false`). When enabled: whitespace-only values are treated as missing on read; empty / whitespace items in array converters throw `EmptyArrayElement (207)` instead of being silently filtered; unresolved `${VAR}` placeholders in cached values and `Envapter.resolve` tagged templates throw `MissingEnvValue (305)` instead of being preserved as literal text. Toggling the flag refreshes the cache.
    - New `@Envapt(key, { required: true })` decorator option. Throws `MissingEnvValue` on first access if the env value is missing or empty (post-trim). Independent of global `strict`. Mutually exclusive with `fallback`: combining them fails to match any overload at compile time, and the runtime Validator throws `InvalidUserDefinedConfig (302)` for dynamic objects that bypass the types.
    - New functional options-bag form: `Envapter.getUsing(key, { converter, required: true })` and `Envapter.getWith(key, { converter, required: true })` return the converter's narrowed type (no `| undefined`) and throw `MissingEnvValue` on missing/empty. Positional `(key, converter, fallback?)` form unchanged.
    - New `Envapter.require(...keys)` existence-check helper. Variadic rest signature, always returns `void`. At least one key required (compile-time error via `[string, ...string[]]` tuple if zero args). Collects every missing key into a single error instead of failing one at a time. Resolves templates before checking.
    - New error codes: `EmptyArrayElement (207)` for strict-mode array empties; `MissingEnvValue (305)` for required-key absences, `require()` failures, and strict-mode unresolved templates.

### Minor Changes

- 9711554: Add `Envapter.baseDir` to anchor `.env` resolution to a directory instead of `process.cwd()`. The auto-cascade, `configureProfiles` paths, and relative `envPaths` resolve against it; absolute paths bypass it. It accepts a directory path or a module location: `import.meta.url` / `import.meta.dirname` (ESM) or `__dirname` (CJS). Left unset, paths resolve against `process.cwd()` as before.

    This covers monorepos where the process starts from the repository root rather than the package directory, so a package-local `.env` resolves regardless of the working directory.

- 9711554: Deprecate the classic positional `@Envapt('KEY', fallback, Converter)` form. It now carries a `@deprecated` JSDoc tag and will be removed in v6; it still works throughout v5. Use the options object: `@Envapt('KEY', { converter, fallback })`.
- 9711554: Add the `envapt/config` side-effect entry, a drop-in for `dotenv/config`. `import 'envapt/config'` (or `node --import envapt/config`, or `node -r envapt/config` in CommonJS) loads envapt's per-environment `.env` cascade and mirrors every loaded key into `process.env`, with zero dependencies. Also adds `Envapter.load()` to eagerly load the cascade on demand instead of lazily on first read.
- 9711554: Lowered the Node engine floor from `>=24.0.0` to `>=20.0.0`. The Node 24 pin was originally there for `util.parseEnv`, which envapt no longer uses now that the internal `.env` parser ships in `src/Dotenv.ts`. Node 20 LTS users (the bulk of the production ecosystem) can install envapt cleanly again. `bun >=1.3.0` and `deno >=2.5.0` engine floors are unchanged.
- 9711554: new **profiles** support. envapt now auto-loads conventional dotenv-flow files based on the active environment: `.env`, `.env.local`, `.env.${env}`, `.env.${env}.local` (most-specific wins, matches Vite). zero config for the common case.

    new `Envapter.configureProfiles({...})` for non-conventional path mappings per environment. configured paths layer on top of the cascade with higher precedence; pass `useDefaults: false` to skip the cascade entirely.

    new `Envapter.resetProfiles()` clears any profile / envPaths configuration back to the cascade default. useful in tests.

    existing `Envapter.envPaths = '...'` still works as the lowest-level override and takes absolute precedence when explicitly set.

- 9711554: Add Standard Schema v1 adapter (zod, valibot, arktype, hand-rolled).
    - New `schema:` option on `@Envapt`. Synchronous schemas only.
    - New `Envapter.parse(key, schema, fallback?)` static + instance methods.
    - New `StandardSchemaV1` interface inlined verbatim from <https://standardschema.dev>; `InferSchemaInput<S>` / `InferSchemaOutput<S>` helpers exported from the package root. Zero runtime peer dependencies.
    - New error codes: `SchemaValidationFailed (208)` populates `err.issues` with the schema's `~standard.validate` issue array; `SchemaThrew (209)` chains the underlying throw via `Error.cause`.
    - Schema slot is mutually exclusive with `converter`: combining them fails to match any overload at compile time, and the runtime Validator throws `InvalidUserDefinedConfig` for dynamic objects that bypass the types.
    - Async-validating schemas resolve the type slot to the `SchemaMustBeSync` brand; the Parser also throws if a Promise leaks past the type check.
    - Missing env + fallback returns the fallback as-is without re-validating it through the schema.

- 9711554: Add per-type shorthand decorators: `@EnvNum`, `@EnvStr`, `@EnvBool`, `@EnvUrl`, `@EnvTime`.

    Each is a thin wrapper over `@Envapt` with a fixed converter, so the call site is the key and an optional fallback (`@EnvNum('PORT', 3000)`). The fallback is typed to the converter: `@EnvUrl` takes a `URL`, `@EnvTime` a millisecond number or a time string, the rest their primitive. They accept the ordered-key array form and resolve through the same cache, getter install, and strict-mode path as `@Envapt`. For `required`, a `schema`, an array, or a custom converter, use `@Envapt` with the options object.

- 9711554: Add `Envapter.syncProcessEnv` opt-in to mirror dotenv-loaded keys back to `process.env`.
    - New `Envapter.syncProcessEnv = boolean` (default `false`). Symmetric with `Envapter.strict` / `Envapter.debug`.
    - When `true`, after every cache (re)build envapt writes the keys it loaded from `.env` files into the real `process.env`. Only the keys the loader actually wrote into the isolated env are mirrored, so first-wins (`override: false`, default) leaves a pre-existing `process.env` value alone and `envFileOptions.override = true` lets the file value win in both the cache and the mirror.
    - Flipping `false` to `true` after the cache is already populated mirrors the existing tracked delta immediately (no cache refresh). Flipping `true` to `false` is one-way: previously mirrored keys remain in `process.env` until the process exits.
    - Invalid setter values (non-boolean) throw `EnvaptError(InvalidUserDefinedConfig)`.
    - Verbose debug emits per-key `mirrored KEY to process.env` lines plus a summary `mirrored N keys to process.env` after each mirror.

- 9711554: `Converters.Time` fallbacks now accept a time-string in addition to a number: `fallback: '10s'` is the same as `fallback: 10000`. also adds `d` (days) and `w` (weeks) to the supported units. `TimeFallback` is exported if you want to type the fallback yourself.

    malformed time-string fallbacks (like `'1.5h'` or `'1500'`, where the runtime expects an integer with an explicit unit) now throw `EnvaptErrorCodes.MalformedTimeFallback` instead of the generic `FallbackConverterTypeMismatch`. number fallbacks keep working the same way.

### Patch Changes

- 9711554: Add cross-runtime integration test layer under `packages/envapt/tests/integration/`.
    - Hand-rolled `node:assert`-based smoke (6 portable suites + 1 Deno-only suite, ~30 assertions): basic get, every built-in converter, fallbacks, missing-file recovery, the `@Envapt` decorator's runtime install path, the v5 features (strict, debug, syncProcessEnv, require), and `@Envapt` syntax compiled by the host runtime's TS transpiler.
    - Runs identically under Node, Bun, and Deno; consumes only the built `dist/index.mjs`.
    - New `test:integration` package script for local Node runs.
    - New GitHub Actions workflow `cross-runtime.yml`: build once, fanout across Node `[20, 22, 24]` on ubuntu plus Node 22 on macos and windows, plus Bun on ubuntu and Deno on ubuntu. Branch protection should gate on the aggregator `cross-runtime ok` job.

    **Known limitation: Bun direct-`.ts` execution with `@Envapt` syntax.** Bun 1.3.10+ ignores the `experimentalDecorators` tsconfig flag and emits TC39 Stage 3 decorators ([bun#27575](https://github.com/oven-sh/bun/issues/27575)); envapt's `@Envapt` is a legacy TypeScript decorator and the call shapes are incompatible. Bun users who want the decorator API should precompile with `tsc` / `tsdown` / Vite first, then run the compiled output with Bun. The functional API (`Envapter.get`, `getNumber`, etc.) works without any build step under direct-`.ts` execution.

    No public API change.

- 9711554: Instance `get` now narrows its return type on a fallback. A redundant overload made `env.get('KEY', 'fallback')` resolve to `string | undefined` instead of `string`; removing it makes instance `get` match static `get`.
- 9711554: Minify the published build and mark the package side-effect-free except the `envapt/config` entry. The
  `dist` output is now minified (roughly halving the npm install size), and the `sideEffects` field lets
  bundlers tree-shake the parts of the surface a consumer does not import. No API or behavior change.
- 9711554: Rewrite the README for v5. The package README is now a short, docs-first landing page: hero, the
  `process.env` to typed-value pitch, install for npm/pnpm/yarn/bun/Deno (JSR), and one quick start each
  for the functional and decorator APIs, an agent-skill install line, with the full reference linked at
  the docs site. Removes the stale v4 surface (the old converter enum, `dotenvConfig`, Node `>=22`, "dotenv bundled").

    Also refresh the npm `description` and `keywords` for registry and search discoverability (adds
    `typescript`, `type-safe`, `deno`, `bun`, `zod`, `valibot`, `arktype`, `validation`, `decorator`,
    `cross-runtime`, and related terms), and fix the `@Envapt` url-converter `@example` to pass a `URL`
    instance for the fallback instead of a string (the previous example would throw at runtime, since the
    url converter validates the fallback as `instanceof URL`).

## 4.1.1

### Patch Changes

- 1244fb1: bump deps

## 4.1.0

### Minor Changes

- a87c8e5: allow passing a list of env as the first arg to Envapt or Envapter methods. envapt will look for the env left-to-right and pick the first available one. passing a string still works and everything that worked before will work the same right now

## 4.0.2

### Patch Changes

- 9c7b728: bump versions
- 9c7b728: add examples for each overload of the Envapt decorator

## 4.0.1

### Patch Changes

- bump deps

## 4.0.0

### Major Changes

- **BREAKING:** Simplify exports and type definitions for ESM and CJS. Replaced the nested exports map with flat fields import, require, and default. Types are now only at ./dist/index.d.ts. Removed the build step that renamed index.d.cts to index.d.mts.

## 3.0.2

### Patch Changes

- 063703c: bump deps

## 3.0.1

### Patch Changes

- bump deps and refactor regexes to use String.raw and RegExp obj in BuiltInConverters to avoid disabling eslint rules

## 3.0.0

### Major Changes

- 482eb6d: **BREAKING:** Custom Converters will now execute even if an env variable is not present in the source env file(s). This allows for using `@Envapt` to validate the existence of variables by throwing errors inside the user-defined Custom Converters

### Patch Changes

- 5d1df34: update README to include new things and better navigation

## 2.2.10

### Patch Changes

- remove codecov config

## 2.2.9

### Patch Changes

- b263044: Ensure expected behavior to reject non ISO strings for Date converters
- 953bcb2: Improve test coverage by ignoring unreachable defensive programming blocks
- 8f0722d: Linting for TSDoc
- bc945d4: Safety when attempting to coerce to Symbol
- a21de8c: Augment ImportMeta instead of exporting a method
- dbd99b9: Cleanup files and configure vitest extension

## 2.2.8

### Patch Changes

- e9e359e: Port tests to vitest

## 2.2.7

### Patch Changes

- Fix readme badge for tests CI and make file ext consistent in workflows dir

## 2.2.6

### Patch Changes

- 01b1ba0: Fix deno missing mocha types error by explicitly importing mocha types in test files
- 0be2af4: Better test names and some badge formatting in README. Also condensed NOTICE and the other license file into one NOTICE.md file.

## 2.2.5

### Patch Changes

- 7bb1923: Fixing types and removing `Error.captureStackTrace` to follow ECMAScript specifications

## 2.2.4

### Patch Changes

- 435a738: Add jsr publishing support and a test for the previous version's type-error patch
- f17ca67: Bump deps: @types/node
- 6d47364: Bump deps: @typescript-eslint/parser
- fe12794: Bump deps: typescript-eslint

## 2.2.3

### Patch Changes

- 73162d8: `undefined` as fallback causing type errors when provided with a BuiltIn or Array Converter
- d56fe89: Fix incorrect example in the README for URL converter and add some comments for `@Envapt` overloads

## 2.2.2

### Patch Changes

- 6c1caaa: Fix grammar mistake in README

## 2.2.1

### Patch Changes

- f1c81cc: Make clear that Envapt can be used with JavaScript too

## 2.2.0

### Minor Changes

- a74e97d: Tagged Template resolver for a easily "one-lining" multiple parsed envs in a string literal. It also supports template variables like `${VAR}`! Check README for usage and examples.

### Patch Changes

- c479505: Missing export for `EnvaptError`
- f15ddc9: Fix cache collisions on Envapt used on a static property in one class, and an instance property in another class with the property name being the same for both
- 447aaa4: Fix incorrect "main" export in package.json

## 2.1.1

### Patch Changes

- "boilerplate of parsing" → "boilerplate of transforming parsed" in README

## 2.1.0

### Minor Changes

- Fix missing `.mjs` build

## 2.0.0

### Major Changes

- 7e3a440: Strict Runtime Validation
    - **BREAKING:** Runtime type validation between converter return types and fallback values exists now... and it's strict!
        - But only for built-in and array converters. You are free to do what you want with custom converters.
    - EnvaptError codes actually make sense now instead of the random numbers they were before
    - Added primitive type coercion validation and better error handling

    Since this didn't exist before, it will break existing code that was previously passing incorrect types.

- 7e3a440: Major Type Inference Improvements
    - **BREAKING:** Improved type inference for `@Envapt` decorator with better type safety
        - Fallbacks and Converters are also validated against each other
            - Fallback always decides the type and converter has to match it, except when using a Primitive constructor.
    - Fixed incorrect type inference in **many** cases
    - **BREAKING:** `@Envapt` won't allow you to use its Classic API for any custom converters anymore. Please use the decorator's Modern API, or the Functional API instead.
        - I updated the overloads for `@Envapt` which fixed most of the type inference issues and also the point above.

    Improved type checking may break existing code that was previously passing incorrect types. Typecheck your files after you update pls.

    Decorators don't exactly set the value they return to the property they decorate, so the inferred type you see on hover for `@Envapt` will be the type of the converter rather than the type of the property it'll set. Although, for the functional API, the type will be the type of the property it'll set.

### Minor Changes

- 7e3a440: Enums for Built-in Converters
    - Added `Converters` enum because they look better than string literals and provide better DX
        - Allows using `Converters.String`, `Converters.Number`, etc. instead of string literals
        - Maintains backward compatibility with string literal converter names

- 7e3a440: Customize Dotenv Configs
    - Change how dotenv loads your env files. (Excludes the `path` and `processEnv` options because Envapter handles those)
        - `Envapter.dotenvConfig` property for setting encoding, debug, override, and other dotenv options
        - Now validates the file paths you provide to ensure they exist

- 7e3a440: New Functional API Methods
    - Added `getUsing()` method for using built-in converters functionally
        - Type overrides in `getUsing<T>()` if you need to specify a different type than the converter's inferred return type
    - Added `getWith()` method for using custom converter functions functionally
    - Functional API actually knows that a value won't be undefined if you pass a fallback value now

### Patch Changes

- 7e3a440: Dev and Testing Improvements
    - Coverage for codecov
    - Tests for BigInt and Symbol types
    - Tests for primitive type coercion and multi-line environment variables
    - LOTS more tests I don't remember

- 7e3a440: Refactored Some Code
    - Envapter went over 400 lines and eslint started crying. It was a sign.
        - It's basically a mixin using inheritance now. Nothing changed for the user though.
    - Some Types were removed from the public API because they didn't have any use outside of internal code.

- 7e3a440: Make README.md pretty 🙏🏻
    - Also shorten some scripts in package.json and update files that use these scripts
