---
'envapt': major
---

**BREAKING:** dropped `dotenv` as a runtime dependency. envapt now has **zero runtime deps**. A small internal `.env` parser ships inline (`src/Dotenv.ts`) that handles the subset of dotenv semantics envapt actually relies on: KEY=VALUE pairs, `export KEY=...` prefix, single / double / backtick quotes (with `\n`, `\r`, `\t`, `\\`, `\"` escape interpretation for double quotes), multi-line quoted values, inline `# comments`, multiple paths with first-wins (or `override: true`), and `encoding` for non-UTF8 files. End-user behavior is unchanged: the existing test suite (357 tests) passes against the new parser.

**BREAKING:** `Envapter.envFileOptions` no longer accepts `quiet` or `DOTENV_KEY`.

- `quiet` existed only to suppress dotenv's marketing tips. envapt never prints anything from the loader, so the option is meaningless. The default `_userDefinedDotenvConfig` is now `{}` instead of `{ quiet: true }`.
- `DOTENV_KEY` was for `dotenv-vault` encrypted `.env` files. Not exercised by any envapt test and out of scope for envapt's internal parser. If you need encrypted env files, decrypt them externally and pass the resulting `.env` path to `Envapter.envPaths`.

Passing either key to `Envapter.envFileOptions = { ... }` now throws `InvalidUserDefinedConfig` (302). The remaining allowed keys are `encoding` and `override`.

**BREAKING:** the env-file options accessor was renamed from `Envapter.dotenvConfig` to `Envapter.envFileOptions` (type `DotenvConfigOptions` to `EnvFileOptions`), since it no longer relates to the dropped `dotenv` package.
